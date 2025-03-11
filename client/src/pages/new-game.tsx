import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define the schema for the form
const newGameSchema = z.object({
  opponent: z.string().min(1, { message: "Opponent name is required" }),
  location: z.string().min(1, { message: "Location is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  time: z.string().min(1, { message: "Time is required" }),
  halfLength: z.coerce.number().min(1, { message: "Half length must be at least 1 minute" }),
  numberOfHalves: z.coerce.number().min(1, { message: "Number of halves must be at least 1" }),
});

type NewGameFormValues = z.infer<typeof newGameSchema>;

export default function NewGame() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Initialize the form with default values
  const form = useForm<NewGameFormValues>({
    resolver: zodResolver(newGameSchema),
    defaultValues: {
      opponent: "",
      location: "Home",
      date: new Date().toISOString().split('T')[0], // Today's date
      time: "14:00", // Default to 2 PM
      halfLength: 40, // Default half length: 40 minutes
      numberOfHalves: 2, // Default to 2 halves
    },
  });
  
  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: async (values: NewGameFormValues) => {
      // Combine date and time for the full timestamp
      const dateTime = new Date(`${values.date}T${values.time}`);
      
      const gameData = {
        opponent: values.opponent,
        location: values.location,
        date: dateTime.toISOString(),
        halfLength: values.halfLength,
        numberOfHalves: values.numberOfHalves,
      };
      
      const response = await apiRequest('POST', '/api/games', gameData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      toast({
        title: "Game Created",
        description: "Now you can set up players and positions",
      });
      navigate(`/player-setup/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create the game. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  function onSubmit(values: NewGameFormValues) {
    createGameMutation.mutate(values);
  }
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-heading">Create New Game</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Game Details Section */}
              <div>
                <h3 className="font-heading font-bold mb-3 text-gray-800">Game Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="opponent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opponent</FormLabel>
                        <FormControl>
                          <Input placeholder="Opponent name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Away">Away</SelectItem>
                            <SelectItem value="Neutral">Neutral</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Game Duration Section */}
              <div>
                <h3 className="font-heading font-bold mb-3 text-gray-800">Game Duration</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="halfLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Half Length (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="numberOfHalves"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Halves</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select number of halves" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="4">4 (Quarters)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Player Assignment Section (Minimal for space) */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-heading font-bold text-gray-800">Player Assignment</h3>
                  <span className="text-sm text-gray-500">(Will configure in next step)</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Assign players to positions and jersey numbers in the next screen.</p>
                <div className="bg-blue-50 p-3 rounded-md text-sm flex items-start">
                  <span className="material-icons text-blue-600 mr-2 mt-0.5">info</span>
                  <p className="text-blue-800">You'll be able to record substitutions during the game.</p>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="mt-8 flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createGameMutation.isPending}
                >
                  {createGameMutation.isPending ? "Creating..." : "Continue to Player Setup"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
