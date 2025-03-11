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
          {/* Create New Game Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mb-4">
                <span className="material-icons text-white text-3xl">add</span>
              </div>
              <h2 className="text-xl font-heading font-bold text-primary">Create New Game</h2>
              <p className="text-gray-600 text-center mt-2">Set up a new match to track player stats and performance</p>
              <Button
                className="mt-6"
                onClick={() => navigate('/new-game')}
              >
                New Game
              </Button>
            </div>
          </div>
          
          {/* Previous Games Section */}
          <div className="md:col-span-2 lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-heading font-bold text-primary">Previous Games</h2>
                <Link href="/game-history">
                  <a className="text-primary-light hover:text-primary-dark transition-colors font-semibold">
                    View All
                  </a>
                </Link>
              </div>
              
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
            </div>
          </div>
          
          {/* Dashboard Preview Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-heading font-bold text-primary">Team Stats</h2>
              <Link href="/dashboard">
                <a className="text-primary-light hover:text-primary-dark transition-colors font-semibold">
                  Full Dashboard
                </a>
              </Link>
            </div>
            
            {games.length === 0 ? (
              <div className="py-4 flex flex-col items-center text-gray-500">
                <span className="material-icons text-4xl mb-3">bar_chart</span>
                <p className="text-center">Track games to see team statistics</p>
              </div>
            ) : (
              <div className="space-y-4">
                <RugbyField />
                <div className="text-center text-sm text-gray-500">
                  View the dashboard for comprehensive team statistics
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
