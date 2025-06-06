import { connectToDB } from "@/db/connectDb";
import { ApiResponse, hashPassword } from "@/lib/utils";
import { Resend } from "resend";
import dotenv from "dotenv"
import EmailTemplate from "@/components/Email-template";
import { User } from "@/schema/UserSchema";
import jwt from "jsonwebtoken";

interface SignUpParams{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

dotenv.config()
const resendApiKey = process.env.RESEND_API_KEY!;


const resend = new Resend(resendApiKey)
const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
    connectToDB();
  
    try {
      const { firstName, lastName, email, password }: SignUpParams = await req.json();
  
      if (!firstName || !lastName || !email || !password) {
        return ApiResponse(400, "Please provide all inputs properly");
      }
  
      const alreadyExists = await User.findOne({ email });
      if (alreadyExists) {
        return ApiResponse(300, "User already exists please sign-in");
      }
  
      const hashedPassword = await hashPassword(password);
  
      // Create the user in DB
      const newUser = new User({
        email,
        hashedPassword,
        userDetails: {
          firstName,
          lastName,
        }
      });
      await newUser.save();
  
      // Generate verification token (contains user email)
      const verificationToken = jwt.sign(
        { email },
        JWT_SECRET,
        { expiresIn: "30m" }
      );
  
      const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL!}/auth/verify-email?token=${verificationToken}`;
  
      // Send the verification email
      try {
        await resend.emails.send({
          from: "Mealivo <onboarding@resend.dev>",
          to: email,
          subject: "Mealivo Email Verification",
          react: EmailTemplate({
            firstName,
            verificationLink,
          }),
        });
      } catch (error) {
        console.error("Error sending verification email", error);
        return ApiResponse(500, "Failed to send verification email");
      };

      return ApiResponse(200, "Verification Email sent");
    } catch (error) {
      console.error("Error in signing up user", error);
      return ApiResponse(400, "Couldn't sign up");
    }
  }
  