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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Search, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Team {
  id: number;
  name: string;
  ageGroup: string;
}

interface Player {
  id: number;
  name: string;
  number?: number;
  position?: string;
  dateOfBirth?: Date;
  teamId?: number;
  email?: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
}

// Player schema for form validation
const playerSchema = z.object({
  name: z.string().min(2, {
    message: "Player name must be at least 2 characters.",
  }),
  number: z.number().optional(),
  position: z.string().optional(),
  dateOfBirth: z.date().optional(),
  teamId: z.number().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

const RUGBY_POSITIONS = [
  "1 - Loosehead Prop",
  "2 - Hooker",
  "3 - Tighthead Prop",
  "4 - Lock",
  "5 - Lock",
  "6 - Blindside Flanker",
  "7 - Openside Flanker",
  "8 - Number 8",
  "9 - Scrum Half",
  "10 - Fly Half",
  "11 - Left Wing",
  "12 - Inside Center",
  "13 - Outside Center",
  "14 - Right Wing",
  "15 - Fullback",
  "Substitute",
];

const ensureValidValue = (value: number | undefined): string => {
  return value === undefined ? "none" : String(value);
};


export default function PlayerPool() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Query to fetch all players
  const {
    data: players = [],
    isLoading: playersLoading,
    isError: playersError
  } = useQuery<Player[]>({
    queryKey: ['/api/players'],
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

  // Form for adding/editing players
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      number: undefined,
      position: "",
      dateOfBirth: undefined,
      teamId: undefined,
      email: "",
      phone: "",
      notes: "",
    },
  });

  // Filter players based on search query
  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.position && player.position.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Reset form when selected player changes
  useState(() => {
    if (selectedPlayer) {
      form.reset({
        name: selectedPlayer.name,
        number: selectedPlayer.number,
        position: selectedPlayer.position,
        dateOfBirth: selectedPlayer.dateOfBirth,
        teamId: selectedPlayer.teamId,
        email: selectedPlayer.email,
        phone: selectedPlayer.phone,
        notes: selectedPlayer.notes,
      });
    } else {
      form.reset({
        name: "",
        number: undefined,
        position: "",
        dateOfBirth: undefined,
        teamId: undefined,
        email: "",
        phone: "",
        notes: "",
      });
    }
  });

  // Create player mutation
  const createPlayerMutation = useMutation({
    mutationFn: async (values: PlayerFormValues) => {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          isActive: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create player');
      }

      return await response.json();
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
    },
  });

  // Update player mutation
  const updatePlayerMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number, values: PlayerFormValues }) => {
      const response = await fetch(`/api/players/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to update player');
      }

      return await response.json();
    },
    onSuccess: () => {
      setSelectedPlayer(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
    },
  });

  // Delete player mutation
  const deletePlayerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete player');
      }

      return true;
    },
    onSuccess: () => {
      setSelectedPlayer(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
    },
  });

  function onPlayerSubmit(values: PlayerFormValues) {
    if (selectedPlayer) {
      updatePlayerMutation.mutate({ id: selectedPlayer.id, values });
    } else {
      createPlayerMutation.mutate(values);
    }
  }

  function handleDeletePlayer(id: number) {
    if (confirm("Are you sure you want to delete this player?")) {
      deletePlayerMutation.mutate(id);
    }
  }

  function getTeamName(teamId: number | undefined) {
    if (!teamId) return "Unassigned";
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Unknown Team";
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Player Pool</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Players List */}
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
              <CardDescription>All players in your club</CardDescription>

              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="max-h-[500px] overflow-y-auto">
              {playersLoading ? (
                <p>Loading players...</p>
              ) : playersError ? (
                <p className="text-red-500">Error loading players</p>
              ) : filteredPlayers.length === 0 ? (
                <p className="text-gray-500">No players found</p>
              ) : (
                <ul className="space-y-2">
                  {filteredPlayers.map(player => (
                    <li 
                      key={player.id} 
                      className={`
                        border p-3 rounded-md 
                        ${selectedPlayer?.id === player.id ? 'border-primary bg-primary/5' : ''}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            {player.name}
                            {player.number && <span className="ml-2 text-sm">#{player.number}</span>}
                          </h3>
                          <div className="flex gap-2 items-center mt-1">
                            {player.position && (
                              <Badge variant="outline">{player.position}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {getTeamName(player.teamId)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedPlayer(player)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePlayer(player.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
                  setSelectedPlayer(null);
                  form.reset({
                    name: "",
                    number: undefined,
                    position: "",
                    dateOfBirth: undefined,
                    teamId: undefined,
                    email: "",
                    phone: "",
                    notes: "",
                  });
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Player
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Player Form */}
        <div className="col-span-1 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{selectedPlayer ? "Edit Player" : "Add New Player"}</CardTitle>
              <CardDescription>
                {selectedPlayer 
                  ? "Update player information" 
                  : "Add a new player to your club"
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onPlayerSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Player name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jersey Number</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Jersey number" 
                              {...field}
                              value={field.value || ''}
                              onChange={e => {
                                const value = e.target.value === '' ? undefined : Number(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select position" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {RUGBY_POSITIONS.map(position => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="teamId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team</FormLabel>
                          <FormControl>
                            <Select
                              value={ensureValidValue(field.value)}
                              onValueChange={(value) => field.onChange(value === "none" ? undefined : Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select team" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Team Selected</SelectItem>
                                {teams.map((team) => (
                                  <SelectItem key={team.id} value={String(team.id)}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>Assign player to a team</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
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
                                  format(field.value, "PPP")
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
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1920-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Player's date of birth
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Additional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createPlayerMutation.isPending || updatePlayerMutation.isPending}
                    >
                      {selectedPlayer ? "Update Player" : "Add Player"}
                    </Button>

                    {selectedPlayer && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setSelectedPlayer(null);
                          form.reset({
                            name: "",
                            number: undefined,
                            position: "",
                            dateOfBirth: undefined,
                            teamId: undefined,
                            email: "",
                            phone: "",
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
        </div>
      </div>
    </div>
  );
}