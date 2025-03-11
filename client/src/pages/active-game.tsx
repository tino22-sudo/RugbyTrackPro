import React, { useState } from 'react';
import { Link, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameEvent, Game } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ActiveGame() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [eventType, setEventType] = useState('');
  const [player, setPlayer] = useState('');
  const [minute, setMinute] = useState('');
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [activeTab, setActiveTab] = useState('game');

  // Query to fetch game data
  const { data: game, isLoading: gameLoading } = useQuery<Game>({
    queryKey: ['games', id],
    queryFn: async () => {
      const response = await fetch(`/api/games/${id}`);
      return response.json();
    },
  });

  // Query to fetch players for the team
  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await fetch('/api/players');
      return response.json();
    },
  });

  // Mutation to add an event
  const addEventMutation = useMutation({
    mutationFn: async (newEvent: Partial<GameEvent>) => {
      const response = await fetch(`/api/games/${id}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });
      return response.json();
    },
    onSuccess: () => {
      // Reset form fields
      setEventType('');
      setPlayer('');
      setMinute('');

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['games', id] });
    },
  });

  // Mutation to update the score
  const updateScoreMutation = useMutation({
    mutationFn: async (data: { homeScore: number; awayScore: number }) => {
      const response = await fetch(`/api/games/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', id] });
    },
  });

  // Mutation to complete the game
  const completeGameMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/games/${id}/complete`, {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    addEventMutation.mutate({
      type: eventType,
      player,
      minute: parseInt(minute),
      gameId: id,
    });
  };

  const handleUpdateScore = (e: React.FormEvent) => {
    e.preventDefault();
    updateScoreMutation.mutate({
      homeScore,
      awayScore,
    });
  };

  const handleCompleteGame = () => {
    completeGameMutation.mutate();
  };

  if (gameLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Game not found</h2>
        <Link href="/">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (game.isCompleted) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-primary">Game Complete</h1>
            <p className="text-sm text-gray-500">This game has been completed</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center">
              <span className="material-icons mr-1">arrow_back</span>
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Game Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 text-center py-4">
              <div className="font-bold">{game.team}</div>
              <div className="text-2xl font-bold">{game.homeScore} - {game.awayScore}</div>
              <div className="font-bold">{game.opponent}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p><strong>Date:</strong> {new Date(game.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {new Date(game.date).toLocaleTimeString()}</p>
              </div>
              <div>
                <p><strong>Location:</strong> {game.location}</p>
                <p><strong>Referee:</strong> {game.referee || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href={`/games/${id}`}>
          <Button className="w-full md:w-auto">
            View Detailed Game Report
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">Active Game</h1>
          <p className="text-sm text-gray-500">Record game events in real-time</p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center">
            <span className="material-icons mr-1">arrow_back</span>
            Back to Home
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 text-center py-4">
            <div className="font-bold">{game.team}</div>
            <div className="text-2xl font-bold">{game.homeScore} - {game.awayScore}</div>
            <div className="font-bold">{game.opponent}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p><strong>Date:</strong> {new Date(game.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {new Date(game.date).toLocaleTimeString()}</p>
            </div>
            <div>
              <p><strong>Location:</strong> {game.location}</p>
              <p><strong>Referee:</strong> {game.referee || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="game">Game Management</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="game" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Update Score</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateScore} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="homeScore">Our Score</Label>
                    <Input
                      id="homeScore"
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="awayScore">Opponent Score</Label>
                    <Input
                      id="awayScore"
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Update Score</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Game Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleCompleteGame} 
                variant="destructive" 
                className="w-full"
              >
                Complete Game
              </Button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                This action will mark the game as complete and finalize the score.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Add Game Event</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger id="eventType">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="goal">Goal</SelectItem>
                        <SelectItem value="assist">Assist</SelectItem>
                        <SelectItem value="yellow">Yellow Card</SelectItem>
                        <SelectItem value="red">Red Card</SelectItem>
                        <SelectItem value="sub_in">Substitution (In)</SelectItem>
                        <SelectItem value="sub_out">Substitution (Out)</SelectItem>
                        <SelectItem value="injury">Injury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="player">Player</Label>
                    <Select value={player} onValueChange={setPlayer}>
                      <SelectTrigger id="player">
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {playersLoading ? (
                          <SelectItem value="loading">Loading players...</SelectItem>
                        ) : (
                          players.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.name} ({player.number})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="minute">Minute</Label>
                    <Input
                      id="minute"
                      type="number"
                      min="0"
                      max="90"
                      value={minute}
                      onChange={(e) => setMinute(e.target.value)}
                      placeholder="Event minute"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">Add Event</Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6">
            <h3 className="font-bold mb-3">Game Events</h3>
            {game.events && game.events.length > 0 ? (
              <div className="space-y-2">
                {game.events.map((event, index) => (
                  <div key={index} className="border rounded p-3 flex items-center">
                    <div className="bg-secondary rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      {event.minute}'
                    </div>
                    <div>
                      <div className="font-semibold">
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1).replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {players.find(p => p.id === event.player)?.name || 'Unknown Player'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No events recorded yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}