"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { NutritionalSummary } from "@/components/NutritionalSummary";
import RecentMealCard from "@/components/RecentMealCard";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useUser } from "@/hooks/use-user";
import { eachMeal, Id, NutrientItem, SearchResults } from "@/types/Meal";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

// Meal categories with their respective colors
const MEAL_CATEGORIES = {
  breakfast: { label: "Breakfast", color: "bg-blue-50", icon: "☕" },
  lunch: { label: "Lunch", color: "bg-green-50", icon: "🍲" },
  dinner: { label: "Dinner", color: "bg-orange-50", icon: "🍽️" },
  snack: { label: "Snack", color: "bg-purple-50", icon: "🥨" },
};

const trackMealformSchema = z.object({
  mealName: z.string().min(2, {
    message: "Meal name must be atleast 2 characters",
  }),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  description: z
    .string()
    .max(80, {
      message: "Description cannot be more than 80 characters",
    })
    .optional(),
  calories: z.string(),
  protein: z.string(),
  carbohydrates: z.string(),
  fat: z.string(),
  fiber: z.string(),
  tags: z.string().array().optional(),
});

const MealsPage = () => {
  const { user, isError, mutate } = useUser();
  const router = useRouter();
  const [showAddMealForm, setShowAddMealForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterMealType, setFilterMealType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>();
  const [searchResults, setSearchResults] = useState<SearchResults[]>([]);

  if(isError) return <div>Error Loading Component, Please Refresh</div>

  const recentMeals = user?.foodsLogged;

  const form = useForm<z.infer<typeof trackMealformSchema>>({
    resolver: zodResolver(trackMealformSchema),
    defaultValues: {
      mealName: "",
      mealType: "breakfast",
      description: "",
      calories: "",
      protein: "",
      carbohydrates: "",
      fat: "",
      fiber: "",
      tags: [""],
    },
  });

  const trackNewMeal = async (values: z.infer<typeof trackMealformSchema>) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${baseUrl}/api/log-meal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: values.mealName,
          mealType: values.mealType,
          description: values.description,
          calories: values.calories,
          protein: values.protein,
          carbohydrates: values.carbohydrates,
          fiber: values.fiber,
          fat: values.fat,
          tags: values.tags,
        })
      })
      if(res.status === 200){
        toast.success("New meal added");
        mutate()
      }
    } catch (error) {
      console.error("Error while adding new meal", error)
    } finally{
      setIsLoading(false);
      setShowAddMealForm(false);
      form.setValue("mealName", "");   
      form.setValue("calories", "");
      form.setValue("protein", "");
      form.setValue("carbohydrates", "");
      form.setValue("fat", "");
      form.setValue("fiber", "");
    }
  };

  const handleDeleteMeal = async (id: Id) => {
    try {
      const res = await fetch(`${baseUrl}/api/delete-meal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealId: id
        })
      });
      if(res.status === 200) {
        mutate();
       toast.success("Meal deleted successfully");
      }else{
        toast.error(res.statusText)
      }
      return;
    } catch (error) {
      console.error("Meal deletion unsuccessfull", error)
      toast.error("Meal deletion failed")
    } 
  };

  const onSelectFood = async (food: SearchResults) => {
    setIsPopoverOpen(false);
    try {
      const res = await fetch(`${baseUrl}/api/food-nutrients/${food.id}`);
      const data = await res.json();
      const { calories, protein, carbs, fat, good } = data;
      const fiberEntry = good.find((item: NutrientItem) => item.title.toLowerCase() === "fiber");
      const fiber = fiberEntry ? fiberEntry.amount : "";

          // Set values in react-hook-form
      form.setValue("mealName", food.title || "");   
      form.setValue("calories", calories || "");
      form.setValue("protein", protein || "");
      form.setValue("carbohydrates", carbs || "");
      form.setValue("fat", fat || "");
      form.setValue("fiber", fiber || "");
    } catch (error) {
      console.error("Error in fetching nutrients of the selected food", error);
    }
  };

  const handleInputValue = async (searchTerm: string) => {
    setIsPopoverOpen(true);
    setIsLoading(true);
    // Send API request
    try {
      const res = await fetch(`${baseUrl}/api/search-meal?query=${searchTerm}`);
      const data = await res.json();
      if (!data) return;
      setSearchResults(data.results);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-10 px-4">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.replace("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Meal Tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button
              onClick={() => setShowAddMealForm(true)}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Plus className="mr-2 h-4 w-4" /> Track New Meal
            </Button>
          </div>
        </div>

        {/* <NutritionalSummary
          totalsMeals={meals.length}
          totalCalories={nutritionalSummary.totalCalories}
          totalProtein={nutritionalSummary.totalProtein}
          totalCarbs={nutritionalSummary.totalCarbs}
        /> */}

        {/* Filter Section */}
        {showFilters && (
          <Card className="mb-8 animate-fade-in">
            <CardHeader>
              <CardTitle>Filter & Sort</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="mealType">Meal Type</Label>
                  <Select
                    value={filterMealType}
                    onValueChange={setFilterMealType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Meals</SelectItem>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortBy">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="calories-high">
                        Calories (High to Low)
                      </SelectItem>
                      <SelectItem value="calories-low">
                        Calories (Low to High)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      placeholder="Search for a meal..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Meal Form */}
        {showAddMealForm && (
          <Card className="mb-8 animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle>Track a New Meal</CardTitle>
              <CardDescription>
                Enter the details of your meal to track its nutrients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Track Meal form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(trackNewMeal)}>
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name="mealName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meal Name</FormLabel>
                              <FormControl>
                                <div className="flex flex-col md:flex-row gap-4">
                                  <div className="relative flex-1">
                                    <Popover
                                      open={isPopoverOpen}
                                      onOpenChange={setIsPopoverOpen}
                                    >
                                      <PopoverTrigger asChild>
                                        <div className="relative w-full">
                                          <Input
                                          {...field}
                                            className="pl-10"
                                          />
                                          {isLoading ? (
                                            <Loader className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                          ) : (
                                            <Search
                                              className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:cursor-pointer"
                                              onClick={() => handleInputValue(field.value)}
                                            />
                                          )}
                                        </div>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className="w-full p-0"
                                        align="start"
                                      >
                                        <div className="max-h-[300px] overflow-y-auto rounded-b-md bg-white">
                                          {searchResults.map((food) => (
                                            <button
                                              key={food.id}
                                              onClick={() => onSelectFood(food)}
                                              className="w-full cursor-pointer items-center justify-between px-4 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                            >
                                              <div className="font-medium">
                                                {food.title}
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="min-w-[180px]">
                        <FormField
                          control={form.control}
                          name="mealType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meal Type</FormLabel>
                              <FormControl>
                                <Select
                                  {...field}
                                  defaultValue={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger id="mealType">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="breakfast">
                                      <div className="flex items-center gap-2">
                                        <span>
                                          {MEAL_CATEGORIES.breakfast.icon}
                                        </span>
                                        <span>Breakfast</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="lunch">
                                      <div className="flex items-center gap-2">
                                        <span>
                                          {MEAL_CATEGORIES.lunch.icon}
                                        </span>
                                        <span>Lunch</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="dinner">
                                      <div className="flex items-center gap-2">
                                        <span>
                                          {MEAL_CATEGORIES.dinner.icon}
                                        </span>
                                        <span>Dinner</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="snack">
                                      <div className="flex items-center gap-2">
                                        <span>
                                          {MEAL_CATEGORIES.snack.icon}
                                        </span>
                                        <span>Snack</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your meal..."
                                {...field}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-4 flex-wrap">
                        <FormField
                          control={form.control}
                          name="calories"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Calories</FormLabel>
                              <FormControl>
                                <Input
                                  type="string"
                                  placeholder="kcal"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="protein"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Protein (g)</FormLabel>
                              <FormControl>
                                <Input
                                  type="string"
                                  placeholder="g"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="carbohydrates"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Carbs (g)</FormLabel>
                              <FormControl>
                                <Input
                                  type="string"
                                  placeholder="g"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fat (g)</FormLabel>
                              <FormControl>
                                <Input
                                  type="string"
                                  placeholder="g"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fiber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fiber (g)</FormLabel>
                              <FormControl>
                                <Input
                                  type="string"
                                  placeholder="g"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    {/* Tags */}
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex-col space-y-2">
                              <FormLabel>Tags</FormLabel>
                              {(field.value ?? []).map((tag, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    placeholder="e.g. high-protein, vegetarian"
                                    className="flex-1"
                                    value={tag}
                                    onChange={(e) => {
                                      const newTags = [...(field.value ?? [])];
                                      newTags[index] = e.target.value;
                                      field.onChange(newTags);
                                    }}
                                  />
                                  {index > 0 && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      type="button"
                                      onClick={() => {
                                        const newTags = [
                                          ...(field.value ?? []),
                                        ];
                                        newTags.splice(index, 1);
                                        field.onChange(newTags);
                                      }}
                                      className="h-8 w-8 flex-shrink-0"
                                    >
                                      ×
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  field.onChange([...(field.value ?? []), ""]);
                                }}
                              >
                                Add Tag
                              </Button>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddMealForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Track Meal</Button>
                  </CardFooter>{" "}
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Recent Meals Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Meals</h2>
            {!showAddMealForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddMealForm(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" /> Quick Add
              </Button>
            )}
          </div>

          {recentMeals && recentMeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white p-12 rounded-lg border border-dashed border-gray-300">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-medium mb-2 text-center">
                No meals found
              </h3>
              <p className="text-gray-500 text-center mb-4">
                {filterMealType !== "all" || searchQuery
                  ? "Try changing your filters or search query"
                  : "Start tracking your meals to see them here"}
              </p>
              <Button onClick={() => setShowAddMealForm(true)}>
                <Plus className="h-4 w-4 mr-2" /> Track Your First Meal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentMeals?.map((meal: eachMeal, index: number) => {
                const nutrients = [
                  {
                    name: "Protein",
                    amount: parseFloat(meal.protein.slice(0, -1)),
                    unit: "g"
                  },
                  {
                    name: "Carbohydrates",
                    amount: parseFloat(meal.carbohydrates.slice(0, -1)),
                    unit: "g"
                  },
                  {
                    name: "Fiber",
                    amount: parseFloat(meal.fiber.slice(0, -1)),
                    unit: "g"
                  },
                  {
                    name: "Fat",
                    amount: parseFloat(meal.fat.slice(0, -1)),
                    unit: "g"
                  }
                ];
                return <RecentMealCard
                  key={index}
                  id={meal._id}
                  mealTypeColor={
                    MEAL_CATEGORIES[
                      meal.mealType as keyof typeof MEAL_CATEGORIES
                    ].color
                  }
                  mealTypeIcon={
                    MEAL_CATEGORIES[
                      meal.mealType as keyof typeof MEAL_CATEGORIES
                    ].icon
                  }
                  mealName={meal.mealName}
                  mealTypeLabel={
                    MEAL_CATEGORIES[
                      meal.mealType as keyof typeof MEAL_CATEGORIES
                    ].label
                  }
                  mealCalories={meal.calories}
                  description={meal.description}
                  tags={meal.tags}
                  nutrients={nutrients}
                  onDelete={handleDeleteMeal}
                />
                })}
            </div>
          )}
        </div>

        {/* All Meals Table View */}
        <Card>
          <CardHeader>
            <CardTitle>All Meals</CardTitle>
            <CardDescription>
              Comprehensive view of all your tracked meals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meal</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Calories</TableHead>
                    <TableHead>Protein</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMeals?.map((meal: eachMeal, index: number) => {
                    const nutrients = [
                      {
                        name: "Protein",
                        amount: parseFloat(meal.protein),
                        unit: "g"
                      },
                      {
                        name: "Carbohydrates",
                        amount: parseFloat(meal.carbohydrates.slice(0, -1)),
                        unit: "g"
                      },
                      {
                        name: "Fiber",
                        amount: parseFloat(meal.fiber.slice(0, -1)),
                        unit: "g"
                      },
                      {
                        name: "Fat",
                        amount: parseFloat(meal.fat.slice(0, -1)),
                        unit: "g"
                      }
                    ];
                    return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{meal.mealName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>
                            {
                              MEAL_CATEGORIES[
                                meal.mealType as keyof typeof MEAL_CATEGORIES
                              ].icon
                            }
                          </span>
                          <span className="capitalize">{meal.mealType}</span>
                        </div>
                      </TableCell>
                      <TableCell>{meal.calories} kcal</TableCell>
                      <TableCell>
                        {nutrients.find((item) => item.name === "Protein")?.amount}
                        g
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleDeleteMeal(meal._id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default MealsPage;