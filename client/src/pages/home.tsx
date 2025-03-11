import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameCard } from '@/components/home/game-card';
import { Game } from '@/types';
import { RugbyField } from '@/components/ui/rugby-field';
import { CalendarRange, Users, Clipboard, PlusCircle } from 'lucide-react';

export default function Home() {
  const [, navigate] = useLocation();
  
  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });
  
  // Sort games by date, most recent first
  const sortedGames = [...games].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Only show the 3 most recent games on the home screen
  const recentGames = sortedGames.slice(0, 3);
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Club Management Section */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-4 text-primary">Club Management</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Team Management Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="mr-2 h-5 w-5 text-primary" />
                    Team Management
                  </CardTitle>
                  <CardDescription>Manage your teams and age groups</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600">Create and manage teams across different age groups</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => navigate('/team-management')}
                  >
                    Manage Teams
                  </Button>
                </CardFooter>
              </Card>

              {/* Player Pool Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="mr-2 h-5 w-5 text-primary" />
                    Player Pool
                  </CardTitle>
                  <CardDescription>Manage your player roster</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600">Add, edit and organize players across all teams</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => navigate('/player-pool')}
                  >
                    Manage Players
                  </Button>
                </CardFooter>
              </Card>

              {/* Fixture Management Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <CalendarRange className="mr-2 h-5 w-5 text-primary" />
                    Fixture Management
                  </CardTitle>
                  <CardDescription>Schedule upcoming matches</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600">Create and manage fixtures for all your teams</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => navigate('/fixture-management')}
                  >
                    Manage Fixtures
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Game Tracking Section */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-4 text-primary">Game Tracking</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Create New Game Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <PlusCircle className="mr-2 h-5 w-5 text-primary" />
                    Create New Game
                  </CardTitle>
                  <CardDescription>Set up a new match</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600">Set up a new game to track player stats and performance</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => navigate('/new-game')}
                  >
                    New Game
                  </Button>
                </CardFooter>
              </Card>

              {/* Previous Games Section */}
              <div className="md:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Recent Games</CardTitle>
                      <Link href="/game-history" className="text-primary-light hover:text-primary-dark transition-colors text-sm font-semibold">
                        View All
                      </Link>
                    </div>
                    <CardDescription>Latest game results</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {isLoading && (
                      <div className="py-8 text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary rounded-full" role="status">
                          <span className="sr-only">Loading...</span>
                        </div>
                      </div>
                    )}
                    
                    {!isLoading && games.length === 0 && (
                      <div className="py-8 flex flex-col items-center text-gray-500">
                        <span className="material-icons text-4xl mb-3">sports_rugby</span>
                        <p className="text-center">No previous games recorded yet.</p>
                        <p className="text-center text-sm">Create your first game to start tracking stats!</p>
                      </div>
                    )}
                    
                    {!isLoading && games.length > 0 && (
                      <div className="space-y-4">
                        {recentGames.map(game => (
                          <GameCard key={game.id} game={game} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Stats and Analytics Section */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-4 text-primary">Stats & Analytics</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Dashboard Card */}
              <Card className="md:col-span-3 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-lg">
                      <Clipboard className="mr-2 h-5 w-5 text-primary" />
                      Team Dashboard
                    </CardTitle>
                    <Link href="/dashboard" className="text-primary-light hover:text-primary-dark transition-colors text-sm font-semibold">
                      Full Dashboard
                    </Link>
                  </div>
                  <CardDescription>View comprehensive team statistics</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {games.length === 0 ? (
                    <div className="py-4 flex flex-col items-center text-gray-500">
                      <span className="material-icons text-4xl mb-3">bar_chart</span>
                      <p className="text-center">Track games to see team statistics</p>
                    </div>
                  ) : (
                    <div className="flex justify-center py-4">
                      <div className="w-3/4 max-w-md">
                        <RugbyField />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
