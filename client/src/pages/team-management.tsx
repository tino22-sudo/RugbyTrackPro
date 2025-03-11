import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BaggageClaim, Users, ClipboardList, PlusCircle, Trash2 } from "lucide-react";

// Team schema for form validation
const teamSchema = z.object({
  name: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
  ageGroup: z.string().min(1, {
    message: "Age group is required.",
  }),
  description: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface Team {
  id: number;
  name: string;
  ageGroup: string;
  description: string | null;
  isActive: boolean;
}

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState("teams");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { toast } = useToast();
  
  // Query to fetch all teams
  const {
    data: teams = [],
    isLoading: teamsLoading,
    isError: teamsError
  } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Form for adding/editing teams
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: selectedTeam?.name || "",
      ageGroup: selectedTeam?.ageGroup || "",
      description: selectedTeam?.description || ""
    },
  });
  
  // Reset form when selected team changes
  useState(() => {
    if (selectedTeam) {
      form.reset({
        name: selectedTeam.name,
        ageGroup: selectedTeam.ageGroup,
        description: selectedTeam.description || ""
      });
    } else {
      form.reset({
        name: "",
        ageGroup: "",
        description: ""
      });
    }
  });
  
  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (values: TeamFormValues) => {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create team');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Team created",
        description: "The team has been created successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number, values: TeamFormValues }) => {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update team');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Team updated",
        description: "The team has been updated successfully.",
      });
      setSelectedTeam(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete team');
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully.",
      });
      setSelectedTeam(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  function onTeamSubmit(values: TeamFormValues) {
    if (selectedTeam) {
      updateTeamMutation.mutate({ id: selectedTeam.id, values });
    } else {
      createTeamMutation.mutate(values);
    }
  }
  
  function handleDeleteTeam(id: number) {
    if (confirm("Are you sure you want to delete this team? All associated players will be unassigned.")) {
      deleteTeamMutation.mutate(id);
    }
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Team Management</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Teams</span>
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2">
            <BaggageClaim className="h-4 w-4" />
            <span>Player Pool</span>
          </TabsTrigger>
          <TabsTrigger value="fixtures" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Fixtures</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="teams" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Teams List */}
            <div className="col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Teams</CardTitle>
                  <CardDescription>Manage your club's teams and age groups</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {teamsLoading ? (
                    <p>Loading teams...</p>
                  ) : teamsError ? (
                    <p className="text-red-500">Error loading teams</p>
                  ) : teams.length === 0 ? (
                    <p className="text-gray-500">No teams created yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {teams.map(team => (
                        <li key={team.id} className="border p-3 rounded-md flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{team.name}</h3>
                            <p className="text-sm text-gray-500">{team.ageGroup}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTeam(team)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteTeam(team.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedTeam(null);
                      form.reset({
                        name: "",
                        ageGroup: "",
                        description: ""
                      });
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New Team
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Team Form */}
            <div className="col-span-1 md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedTeam ? "Edit Team" : "Add New Team"}</CardTitle>
                  <CardDescription>
                    {selectedTeam 
                      ? "Update team information" 
                      : "Create a new team for your club"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onTeamSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter team name" {...field} />
                            </FormControl>
                            <FormDescription>
                              The name of your team
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="ageGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age Group</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. U16, Seniors, Masters" {...field} />
                            </FormControl>
                            <FormDescription>
                              The age category for this team
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Additional information about the team" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-2 pt-4">
                        <Button 
                          type="submit" 
                          className="flex-1"
                          disabled={createTeamMutation.isPending || updateTeamMutation.isPending}
                        >
                          {selectedTeam ? "Update Team" : "Create Team"}
                        </Button>
                        
                        {selectedTeam && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedTeam(null);
                              form.reset({
                                name: "",
                                ageGroup: "",
                                description: ""
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="players" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Player Pool Management</CardTitle>
              <CardDescription>
                Manage the players in your club and assign them to teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Player pool management will be implemented here. This will allow you to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Create and manage player profiles</li>
                <li>Assign players to specific teams</li>
                <li>View players by team or age group</li>
                <li>Track player information like position and date of birth</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button disabled>This feature is coming soon</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="fixtures" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Fixture Management</CardTitle>
              <CardDescription>
                Manage fixtures and schedules for your teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Fixture management will be implemented here. This will allow you to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Create upcoming fixtures for each team</li>
                <li>Manage game schedules and locations</li>
                <li>Convert fixtures to games when they're ready to be played</li>
                <li>View fixture history and upcoming games</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button disabled>This feature is coming soon</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}