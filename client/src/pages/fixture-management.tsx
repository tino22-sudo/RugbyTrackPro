import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, PlusCircle, Pencil, Trash2, PlaySquare } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: number;
  name: string;
  ageGroup: string;
}

interface Fixture {
  id: number;
  teamId: number;
  opponent: string;
  date: Date;
  location: string;
  isHome: boolean;
  notes?: string;
}

// Fixture schema for form validation
const fixtureSchema = z.object({
  teamId: z.number({
    required_error: "Team is required",
  }),
  opponent: z.string().min(2, {
    message: "Opponent name must be at least 2 characters.",
  }),
  date: z.date({
    required_error: "Date is required",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  isHome: z.boolean().default(true),
  notes: z.string().optional(),
});

type FixtureFormValues = z.infer<typeof fixtureSchema>;

// Schema for creating a game from a fixture
const createGameSchema = z.object({
  halfLength: z.number().min(1, {
    message: "Half length must be at least 1 minute.",
  }),
  numberOfHalves: z.number().min(1, {
    message: "Number of halves must be at least 1.",
  }),
});

type CreateGameFormValues = z.infer<typeof createGameSchema>;

export default function FixtureManagement() {
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Query to fetch all fixtures
  const {
    data: fixtures = [],
    isLoading: fixturesLoading,
    isError: fixturesError
  } = useQuery<Fixture[]>({
    queryKey: ['/api/fixtures'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Query to fetch all teams
  const {
    data: teams = [],
    isLoading: teamsLoading,
  } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fixture form
  const fixtureForm = useForm<FixtureFormValues>({
    resolver: zodResolver(fixtureSchema),
    defaultValues: {
      teamId: undefined,
      opponent: "",
      date: undefined,
      location: "",
      isHome: true,
      notes: "",
    },
  });
  
  // Game creation form
  const gameForm = useForm<CreateGameFormValues>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      halfLength: 40,
      numberOfHalves: 2,
    },
  });
  
  // Reset form when selected fixture changes
  useState(() => {
    if (selectedFixture) {
      fixtureForm.reset({
        teamId: selectedFixture.teamId,
        opponent: selectedFixture.opponent,
        date: new Date(selectedFixture.date),
        location: selectedFixture.location,
        isHome: selectedFixture.isHome,
        notes: selectedFixture.notes,
      });
    } else {
      fixtureForm.reset({
        teamId: undefined,
        opponent: "",
        date: undefined,
        location: "",
        isHome: true,
        notes: "",
      });
    }
  });
  
  // Create fixture mutation
  const createFixtureMutation = useMutation({
    mutationFn: async (values: FixtureFormValues) => {
      const response = await fetch('/api/fixtures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create fixture');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fixture created",
        description: "The fixture has been created successfully.",
      });
      fixtureForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/fixtures'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update fixture mutation
  const updateFixtureMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number, values: FixtureFormValues }) => {
      const response = await fetch(`/api/fixtures/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update fixture');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fixture updated",
        description: "The fixture has been updated successfully.",
      });
      setSelectedFixture(null);
      fixtureForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/fixtures'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete fixture mutation
  const deleteFixtureMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/fixtures/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete fixture');
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Fixture deleted",
        description: "The fixture has been deleted successfully.",
      });
      setSelectedFixture(null);
      fixtureForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/fixtures'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Create game from fixture mutation
  const createGameMutation = useMutation({
    mutationFn: async ({ fixtureId, values }: { fixtureId: number, values: CreateGameFormValues }) => {
      // Get fixture details
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (!fixture) throw new Error('Fixture not found');
      
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: fixture.teamId,
          fixtureId: fixtureId,
          opponent: fixture.opponent,
          date: fixture.date,
          location: fixture.location,
          halfLength: values.halfLength,
          numberOfHalves: values.numberOfHalves,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create game from fixture');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Game created",
        description: "Game created successfully from fixture.",
      });
      setGameModalOpen(false);
      gameForm.reset();
      // Navigate to player setup for the new game
      navigate(`/player-setup?gameId=${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  function onFixtureSubmit(values: FixtureFormValues) {
    if (selectedFixture) {
      updateFixtureMutation.mutate({ id: selectedFixture.id, values });
    } else {
      createFixtureMutation.mutate(values);
    }
  }
  
  function onGameSubmit(values: CreateGameFormValues) {
    if (selectedFixture) {
      createGameMutation.mutate({ fixtureId: selectedFixture.id, values });
    }
  }
  
  function handleDeleteFixture(id: number) {
    if (confirm("Are you sure you want to delete this fixture?")) {
      deleteFixtureMutation.mutate(id);
    }
  }
  
  function handleCreateGame(fixture: Fixture) {
    setSelectedFixture(fixture);
    setGameModalOpen(true);
  }
  
  function getTeamName(teamId: number) {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Unknown Team";
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Fixture Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fixtures List */}
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fixtures</CardTitle>
              <CardDescription>Upcoming matches for your teams</CardDescription>
            </CardHeader>
            
            <CardContent className="max-h-[500px] overflow-y-auto space-y-4">
              {fixturesLoading ? (
                <p>Loading fixtures...</p>
              ) : fixturesError ? (
                <p className="text-red-500">Error loading fixtures</p>
              ) : fixtures.length === 0 ? (
                <p className="text-gray-500">No fixtures scheduled</p>
              ) : (
                // Group fixtures by date
                Array.from(
                  new Set(fixtures.map(fixture => 
                    format(new Date(fixture.date), 'yyyy-MM-dd')
                  ))
                ).map(dateStr => {
                  const date = new Date(dateStr);
                  const fixturesOnDate = fixtures.filter(fixture => 
                    format(new Date(fixture.date), 'yyyy-MM-dd') === dateStr
                  );
                  
                  return (
                    <div key={dateStr} className="space-y-2">
                      <h3 className="font-medium text-sm text-muted-foreground">
                        {format(date, 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <ul className="space-y-2">
                        {fixturesOnDate.map(fixture => (
                          <li 
                            key={fixture.id} 
                            className={`
                              border p-3 rounded-md 
                              ${selectedFixture?.id === fixture.id ? 'border-primary bg-primary/5' : ''}
                            `}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">
                                  {fixture.isHome ? (
                                    <>
                                      <span className="text-green-600">Home</span> vs {fixture.opponent}
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-blue-600">Away</span> @ {fixture.opponent}
                                    </>
                                  )}
                                </h3>
                                <div className="flex gap-2 items-center mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(fixture.date), 'h:mm a')} at {fixture.location}
                                  </span>
                                </div>
                                <Badge variant="outline" className="mt-1">
                                  {getTeamName(fixture.teamId)}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCreateGame(fixture)}
                                  title="Create game from fixture"
                                >
                                  <PlaySquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedFixture(fixture)}
                                  title="Edit fixture"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteFixture(fixture.id)}
                                  title="Delete fixture"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </CardContent>
            
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedFixture(null);
                  fixtureForm.reset({
                    teamId: undefined,
                    opponent: "",
                    date: undefined,
                    location: "",
                    isHome: true,
                    notes: "",
                  });
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Fixture
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Fixture Form */}
        <div className="col-span-1 md:col-span-2">
          {gameModalOpen && selectedFixture ? (
            <Card>
              <CardHeader>
                <CardTitle>Create Game</CardTitle>
                <CardDescription>
                  Set up a game from the selected fixture
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6 p-4 border rounded-md bg-muted/50">
                  <h3 className="font-medium">Fixture Details:</h3>
                  <p className="mt-1">
                    <strong>Team:</strong> {getTeamName(selectedFixture.teamId)}
                  </p>
                  <p>
                    <strong>Opponent:</strong> {selectedFixture.opponent}
                  </p>
                  <p>
                    <strong>Date:</strong> {format(new Date(selectedFixture.date), 'PPPp')}
                  </p>
                  <p>
                    <strong>Location:</strong> {selectedFixture.location}
                  </p>
                  <p>
                    <strong>Home/Away:</strong> {selectedFixture.isHome ? 'Home' : 'Away'}
                  </p>
                </div>
                
                <Form {...gameForm}>
                  <form onSubmit={gameForm.handleSubmit(onGameSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={gameForm.control}
                        name="halfLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Half Length (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Duration of each half in minutes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={gameForm.control}
                        name="numberOfHalves"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Halves</FormLabel>
                            <Select
                              onValueChange={value => field.onChange(parseInt(value))}
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select number of halves" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="4">4 (Quarters)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Standard rugby league is 2 halves
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={createGameMutation.isPending}
                      >
                        Create Game
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setGameModalOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{selectedFixture ? "Edit Fixture" : "Add New Fixture"}</CardTitle>
                <CardDescription>
                  {selectedFixture 
                    ? "Update fixture information" 
                    : "Schedule a new match for your team"
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...fixtureForm}>
                  <form onSubmit={fixtureForm.handleSubmit(onFixtureSubmit)} className="space-y-4">
                    <FormField
                      control={fixtureForm.control}
                      name="teamId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            defaultValue={field.value?.toString()}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select team" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teams.map(team => (
                                <SelectItem key={team.id} value={team.id.toString()}>
                                  {team.name} ({team.ageGroup})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>The team playing in this fixture</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={fixtureForm.control}
                        name="opponent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opponent</FormLabel>
                            <FormControl>
                              <Input placeholder="Opponent team name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={fixtureForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Match location" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={fixtureForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date and Time</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-left font-normal ${
                                      !field.value && "text-muted-foreground"
                                    }`}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP p")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    if (date) {
                                      const currentDate = field.value || new Date();
                                      date.setHours(currentDate.getHours());
                                      date.setMinutes(currentDate.getMinutes());
                                      field.onChange(date);
                                    }
                                  }}
                                  initialFocus
                                />
                                <div className="p-3 border-t border-border">
                                  <Input
                                    type="time"
                                    value={field.value ? format(field.value, "HH:mm") : ""}
                                    onChange={(e) => {
                                      const [hours, minutes] = e.target.value.split(':').map(Number);
                                      const newDate = field.value || new Date();
                                      newDate.setHours(hours);
                                      newDate.setMinutes(minutes);
                                      field.onChange(newDate);
                                    }}
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              When the match will take place
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={fixtureForm.control}
                        name="isHome"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Home Game
                              </FormLabel>
                              <FormDescription>
                                Check if this is a home game, uncheck for away game
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={fixtureForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional notes about this fixture"
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
                        disabled={createFixtureMutation.isPending || updateFixtureMutation.isPending}
                      >
                        {selectedFixture ? "Update Fixture" : "Create Fixture"}
                      </Button>
                      
                      {selectedFixture && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedFixture(null);
                            fixtureForm.reset({
                              teamId: undefined,
                              opponent: "",
                              date: undefined,
                              location: "",
                              isHome: true,
                              notes: "",
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
          )}
        </div>
      </div>
    </div>
  );
}