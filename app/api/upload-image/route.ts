import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { ApiResponse } from "@/lib/utils";
import { connectToDB } from "@/db/connectDb";
import jwt from "jsonwebtoken";
import { User } from "@/schema/UserSchema";

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const jwtSecret = process.env.JWT_SECRET!;

interface CloudinaryUploadResults {
  public_id: string;
  format: string;
  width: number;
  height: number;
  secure_url: string;
  created_at: string;
  original_filename: string;
  signature: string;
}

const handleDeleteImage = async (publicId: string) => {
   try {
      const res = await cloudinary.uploader.destroy(publicId);
      if (res.result !== "ok"){
        console.log("Clouinary problem maybe")
        return ApiResponse(400, "Image deletion in cloudinary failed");
}
      // todo: WE CAN RETRY THE DELETION HERE AND IF STILL IT FAILS THEN RETURN
    } catch (error) {
      console.error("Error occured in deleting image from cloudinary", error);
      return ApiResponse(
        500,
        "Error occured in deleting image from cloudinary"
      );
    }
}

export async function POST(req: NextRequest, res: NextResponse) {
  connectToDB();
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | undefined;
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!file) return ApiResponse(400, "File not found");
    if(type !== "cover" && type !== "profile") return ApiResponse(400, "File type is incorrect");
    if (!accessToken) return ApiResponse(500, "Access Token not found");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let payload;
    try {
      payload = jwt.verify(accessToken, jwtSecret) as { userId: string };
    } catch {
      return ApiResponse(401, "Invalid or expired token");
    }    
    const user = await User.findById(payload.userId);
    if (!user) return ApiResponse(400, "User not found");

    //Check before uploading if there is already a image uploaded for the given type
    let publicId;
    if(type === "profile" && user.userDetails.profilePicUrl !== null){
        publicId = user.userDetails.profilePicId;
        await handleDeleteImage(publicId);
        user.userDetails.profilePicUrl = null;
        user.userDetails.profilePicId = null;
    };
    if(type === "cover" && user.userDetails.coverBgUrl !== null){
        publicId = user.userDetails.coverBgId;
        await handleDeleteImage(publicId);
        user.userDetails.coverBgUrl = null;
        user.userDetails.coverBgId = null;
    };

    const result = await new Promise<CloudinaryUploadResults>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: type },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryUploadResults);
          }
        );
        uploadStream.end(buffer);
      }
    );

    if(type === "profile"){   
      user.userDetails.profilePicUrl = result.secure_url;
      user.userDetails.profilePicId = result.public_id;
    }else{
      user.userDetails.coverBgUrl = result.secure_url;
      user.userDetails.coverBgId = result.public_id;
    }
    await user.save()
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.log("Upload image failed", error);
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }
}
