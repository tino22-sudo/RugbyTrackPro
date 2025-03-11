import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GameCard } from '@/components/home/game-card';
import { Game } from '@/types';

export default function GameHistory() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  
  // Fetch all games
  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });
  
  // Apply filters and sorting
  const filteredGames = games.filter(game => {
    // Apply location filter
    if (locationFilter !== 'all' && game.location !== locationFilter) {
      return false;
    }
    
    // Apply search filter (case insensitive)
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      return (
        game.opponent.toLowerCase().includes(lowerCaseSearch) ||
        new Date(game.date).toLocaleDateString().toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    return true;
  });
  
  // Apply sorting
  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'opponent-asc':
        return a.opponent.localeCompare(b.opponent);
      case 'opponent-desc':
        return b.opponent.localeCompare(a.opponent);
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });
  
  // Calculate stats
  const totalGames = games.length;
  const completedGames = games.filter(game => game.isCompleted).length;
  const inProgressGames = games.filter(game => !game.isCompleted).length;
  
  // Calculate win/loss record
  const gameResults = games
    .filter(game => game.isCompleted)
    .reduce(
      (acc, game) => {
        if (game.homeScore > game.awayScore) acc.wins++;
        else if (game.homeScore < game.awayScore) acc.losses++;
        else acc.draws++;
        return acc;
      },
      { wins: 0, losses: 0, draws: 0 }
    );
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">Game History</h1>
          <p className="text-sm text-gray-500">View and manage your previous games</p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center">
            <span className="material-icons mr-1">arrow_back</span>
            Back to Home
          </Button>
        </Link>
      </div>
      
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{totalGames}</div>
              <p className="text-sm text-gray-500 mt-1">Total Games</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{gameResults.wins}</div>
              <p className="text-sm text-gray-500 mt-1">Wins</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600">{gameResults.losses}</div>
              <p className="text-sm text-gray-500 mt-1">Losses</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-600">{gameResults.draws}</div>
              <p className="text-sm text-gray-500 mt-1">Draws</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input
                id="search"
                placeholder="Search by opponent or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <Select
                value={locationFilter}
                onValueChange={setLocationFilter}
              >
                <SelectTrigger id="location-filter" className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <Select
                value={sortBy}
                onValueChange={setSortBy}
              >
                <SelectTrigger id="sort-by" className="w-40">
                  <SelectValue placeholder="Date (Newest)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                  <SelectItem value="opponent-asc">Opponent (A-Z)</SelectItem>
                  <SelectItem value="opponent-desc">Opponent (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Status filter chips */}
          <div className="flex gap-2 mt-4">
            <Badge variant="outline" className="cursor-pointer">
              All ({totalGames})
            </Badge>
            <Badge variant="secondary" className="cursor-pointer">
              Completed ({completedGames})
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              In Progress ({inProgressGames})
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Game List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : sortedGames.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <span className="material-icons text-4xl text-gray-400 mb-2">search_off</span>
            <p className="text-gray-500">No games found matching your filters</p>
            {searchTerm && (
              <Button variant="ghost" className="mt-4" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
