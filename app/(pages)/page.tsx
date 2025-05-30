"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Utensils,
  Activity,
  Droplet,
  PieChart,
  ForkKnife,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { eachMeal } from "@/types/Meal";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const { user, firstLetter, isLoading, isError } = useUser();
  const [avgCalories, setAvgCalories] = useState<number | undefined>()
  const [protein, setProtein] = useState<number | undefined>();
  const [fiber, setFiber] = useState<number | undefined>();
  const router = useRouter();

  const recentMeals = user?.foodsLogged;
  let mostRecentMeals = recentMeals?.toReversed().splice(0,3);
  
  useEffect(() => {
    if(user?.foodsLogged){
      let totalCalories = 0;
      let totalProtein = 0;
      let totalFiber = 0;
      user.foodsLogged.forEach((item: eachMeal) => {
        const calories = parseFloat(item.calories);
        const protein = parseFloat(item.protein);
        const fiber = parseFloat(item.fiber);
        if(!isNaN(calories)){
          totalCalories += calories;
        }
        if(!isNaN(protein)){
          totalProtein += protein;
        }
        if(!isNaN(fiber)){
          totalFiber += fiber;
        }
      })
      if(user.foodsLogged.length > 0){
        let calculatedAvgCalories = (totalCalories / user.foodsLogged.length).toFixed(2)
        setAvgCalories(Number(calculatedAvgCalories));
      }else {
        setAvgCalories(0)
      }
      setProtein(totalProtein);
      setFiber(totalFiber)
    }
  }, [user])

  if (isLoading) return <p>Loading...</p>;
  if (isError || !user) {
    toast("User not found");
    return <p>Error loading user info</p>;
  };


  // Real data calculations

  // Mock data for charts
  const caloriesData = [
    { name: "Mon", calories: 1950 },
    { name: "Tue", calories: 2100 },
    { name: "Wed", calories: 1850 },
    { name: "Thu", calories: 2300 },
    { name: "Fri", calories: 2050 },
    { name: "Sat", calories: 2200 },
    { name: "Sun", calories: 1900 },
  ];

  const macrosData = [
    { name: "Mon", protein: 85, carbs: 220, fat: 65 },
    { name: "Tue", protein: 92, carbs: 240, fat: 70 },
    { name: "Wed", protein: 78, carbs: 190, fat: 60 },
    { name: "Thu", protein: 95, carbs: 250, fat: 75 },
    { name: "Fri", protein: 88, carbs: 210, fat: 68 },
    { name: "Sat", protein: 90, carbs: 230, fat: 72 },
    { name: "Sun", protein: 82, carbs: 200, fat: 63 },
  ];

  const pieData = [
    { name: "Protein", value: 82, color: "#8884d8" },
    { name: "Carbs", value: 200, color: "#82ca9d" },
    { name: "Fat", value: 63, color: "#ffc658" },
  ];

  // Chart config
  const chartConfig = {
    calories: { label: "Calories", color: "#FF6384" },
    protein: { label: "Protein", color: "#8884d8" },
    carbs: { label: "Carbs", color: "#82ca9d" },
    fat: { label: "Fat", color: "#ffc658" },
  };

  return (
    <div className="min-h-screen bg-gray-50/70">
      {/* Dashboard header with gradient */}
      <div className="bg-gradient-to-r from-blue-500/90 to-indigo-600/90 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl">
                Welcome back, {user.firstName}
              </h1>
              <p className="mt-2 text-sm text-blue-100">
                Track your nutrition journey and stay healthy
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-5 justify-center items-center">
              <Button className="hover:bg-black hover:text-white bg-white text-black flex items-center gap-2 shadow-sm" onClick={() => router.push("/meals")}>
                <ForkKnife className="h-4 w-4" />
                Track Meal 
              </Button>
              <Link href={"/profile"}>
              <Avatar className="hover:shadow-2xl hover:shadow-accent">
                {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
                <AvatarFallback>{firstLetter}</AvatarFallback>
              </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats overview with subtle animations */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardDescription>Meals tracked</CardDescription>
                  <CardTitle className="text-3xl">{user?.foodsLogged.length}</CardTitle>
                </div>
                <Utensils className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">+12%</span>{" "}
                    from last week
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardDescription>Average calories</CardDescription>
                  <CardTitle className="text-3xl">{avgCalories ? avgCalories : 0}</CardTitle>
                </div>
                <Activity className="h-5 w-5 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingDown className="mr-1 h-4 w-4 text-rose-500" />
                  <p className="text-xs text-muted-foreground">
                    <span className="text-rose-500 font-medium">+3%</span> from
                    last week
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardDescription>Protein intake (g)</CardDescription>
                  <CardTitle className="text-3xl">{protein}</CardTitle>
                </div>
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-600">P</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">+7%</span> from
                    last week
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardDescription>Fiber intake (g)</CardDescription>
                  <CardTitle className="text-3xl">{fiber}</CardTitle>
                </div>
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">F</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">+2%</span> from
                    last week
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nutrition trends with real charts */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Nutrition Trends</CardTitle>
                  <CardDescription>
                    Track your nutrition patterns over the past week
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="calories">
                <TabsList className="mb-4">
                  <TabsTrigger value="calories">
                    <BarChartIcon className="h-4 w-4 mr-2" />
                    Calories
                  </TabsTrigger>
                  <TabsTrigger value="macros">
                    <LineChartIcon className="h-4 w-4 mr-2" />
                    Macros
                  </TabsTrigger>
                  <TabsTrigger value="breakdown">
                    <PieChart className="h-4 w-4 mr-2" />
                    Breakdown
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="calories" className="space-y-4">
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer>
                      <BarChart
                        data={caloriesData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          opacity={0.3}
                        />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="calories"
                          fill="#FF6384"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="macros" className="space-y-4">
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer>
                      <LineChart
                        data={macrosData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          opacity={0.3}
                        />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="protein"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="carbs"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="fat"
                          stroke="#ffc658"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="breakdown" className="space-y-4">
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer>
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Recent meals section with improved styling */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Meals</CardTitle>
                  <CardDescription>
                    Your most recently logged meals
                  </CardDescription>
                </div>
                <Link href="/meals">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                {mostRecentMeals?.map((item: eachMeal, idx: number) => (
                  <div className="p-4 border-b hover:bg-gray-50 transition-colors" key={idx}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full 
                          ${item.mealType === "breakfast" ? "bg-green-500": ""}
                          ${item.mealType === "lunch" ? "bg-yellow-500": ""}
                          ${item.mealType === "snack" ? "bg-blue-600": ""}
                          ${item.mealType === "dinner" ? "bg-purple-500": ""}
                          `}></span>
                        {item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.mealName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">{item.calories} kcal</p>
                      <p className="text-sm text-gray-500">
                        P: {item.protein} | C: {item.carbohydrates} | F: {item.fat}
                      </p>
                    </div>
                  </div>
                </div>
                ))}
              </div>
              <div className="flex justify-center mt-4">
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
