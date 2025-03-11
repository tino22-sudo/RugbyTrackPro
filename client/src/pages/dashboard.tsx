import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Game, Player, Stat, PlayerStat } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState<string>('team');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');

  // Fetch games
  const { data: games = [], isLoading: isLoadingGames } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  // Fetch players
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  // Fetch all stats - in a real app we would have a dedicated API for analytics
  const { data: gameStats = [], isLoading: isLoadingGameStats } = useQuery<Stat[]>({
    queryKey: [`/api/stats`],
    // This endpoint doesn't exist in the current API, but would be ideal for a dashboard
    // Instead we would fetch game by game and combine
  });

  // Organize stats by player and type for all games or selected game
  const playerStats = useMemo(() => {
    if (isLoadingGames || isLoadingPlayers || isLoadingGameStats) return [];

    const statsByPlayer: Record<number, Record<string, number>> = {};

    // Filter stats by selected game if not 'all'
    const filteredStats = selectedGame === 'all' 
      ? gameStats 
      : gameStats.filter(stat => stat.gameId === Number(selectedGame));

    // Group stats by player and stat type
    filteredStats.forEach(stat => {
      if (!statsByPlayer[stat.playerId]) {
        statsByPlayer[stat.playerId] = {};
      }

      if (!statsByPlayer[stat.playerId][stat.statType]) {
        statsByPlayer[stat.playerId][stat.statType] = 0;
      }

      statsByPlayer[stat.playerId][stat.statType] += stat.value;
    });

    // Convert to array format with player information
    return Object.entries(statsByPlayer).map(([playerId, stats]) => {
      const player = players.find(p => p.id === Number(playerId));

      // Filter by position if selected
      if (selectedPosition !== 'all') {
        const positionNumber = Number(playerId);
        if (selectedPosition === 'forwards' && (positionNumber < 1 || positionNumber > 8)) return null;
        if (selectedPosition === 'backs' && (positionNumber < 9 || positionNumber > 15)) return null;
        if (selectedPosition === 'substitutes' && positionNumber <= 15) return null;
      }

      return {
        playerId: Number(playerId),
        playerName: player?.name || 'Unknown Player',
        ...stats
      };
    }).filter(Boolean);
  }, [games, players, gameStats, selectedGame, selectedPosition]);

  // Calculate totals by stat type for team stats
  const teamStats = useMemo(() => {
    if (isLoadingGames || isLoadingGameStats) return [];

    const statsByType: Record<string, number> = {};

    // Filter stats by selected game if not 'all'
    const filteredStats = selectedGame === 'all'
      ? gameStats
      : gameStats.filter(stat => stat.gameId === Number(selectedGame));

    // Group stats by type
    filteredStats.forEach(stat => {
      if (!statsByType[stat.statType]) {
        statsByType[stat.statType] = 0;
      }
      statsByType[stat.statType] += stat.value;
    });

    // Convert to array format for charts
    return Object.entries(statsByType).map(([type, value]) => ({
      name: type,
      value
    }));
  }, [games, gameStats, selectedGame]);

  // Game results for win/loss chart
  const gameResults = useMemo(() => {
    if (isLoadingGames) return { wins: 0, losses: 0, draws: 0 };

    const completedGames = games.filter(game => game.isCompleted);

    return completedGames.reduce((acc, game) => {
      if (game.homeScore > game.awayScore) acc.wins++;
      else if (game.homeScore < game.awayScore) acc.losses++;
      else acc.draws++;
      return acc;
    }, { wins: 0, losses: 0, draws: 0 });
  }, [games]);

  // Colors for charts
  const COLORS = ['#2563EB', '#16A34A', '#CA8A04', '#9333EA', '#4F46E5', '#DB2777', '#F97316'];

  if (isLoadingGames || isLoadingPlayers || isLoadingGameStats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">Team Dashboard</h1>
          <p className="text-sm text-gray-500">Analyze performance and statistics</p>
        </div>
        <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={() => window.location.href = '/'}
          >
            <span className="material-icons mr-1">arrow_back</span>
            Back to Home
          </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-medium">Game Filter</h3>
              <Select
                value={selectedGame}
                onValueChange={setSelectedGame}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  {games.map(game => (
                    <SelectItem key={game.id} value={game.id.toString()}>
                      vs. {game.opponent} ({new Date(game.date).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-medium">Position Filter</h3>
              <Select
                value={selectedPosition}
                onValueChange={setSelectedPosition}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="forwards">Forwards (1-8)</SelectItem>
                  <SelectItem value="backs">Backs (9-15)</SelectItem>
                  <SelectItem value="substitutes">Substitutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="team" value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="team">Team Stats</TabsTrigger>
          <TabsTrigger value="players">Player Stats</TabsTrigger>
          <TabsTrigger value="results">Game Results</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Overview</CardTitle>
              <CardDescription>
                {selectedGame === 'all' ? 'Stats across all games' : `Stats for selected game`}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={teamStats}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Count" fill="#2563EB" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Stat Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={teamStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {teamStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Game Results</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Wins', value: gameResults.wins, color: '#16A34A' },
                      { name: 'Losses', value: gameResults.losses, color: '#DC2626' },
                      { name: 'Draws', value: gameResults.draws, color: '#9CA3AF' }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Games" fill={(entry) => entry.color} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Players with the highest stats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                      {teamStats.map(stat => (
                        <th key={stat.name} scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {stat.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {playerStats.map((player: any) => (
                      <tr key={player.playerId}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="font-medium">{player.playerName}</div>
                        </td>
                        {teamStats.map(stat => (
                          <td key={`${player.playerId}-${stat.name}`} className="px-3 py-2 whitespace-nowrap text-center">
                            {player[stat.name] || 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Player Comparison</CardTitle>
              <CardDescription>Compare top players' performance</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={playerStats.slice(0, 5).map((player: any) => {
                    const topStat = teamStats[0]?.name || 'Tackles';
                    return {
                      name: player.playerName,
                      value: player[topStat] || 0,
                      statType: topStat
                    };
                  })}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name={(entry) => entry.statType} fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Results Summary</CardTitle>
              <CardDescription>Win/Loss record and points scored</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-md p-4 text-center">
                  <div className="text-sm text-gray-600">Wins</div>
                  <div className="text-3xl font-bold text-green-800">{gameResults.wins}</div>
                </div>

                <div className="bg-red-50 rounded-md p-4 text-center">
                  <div className="text-sm text-gray-600">Losses</div>
                  <div className="text-3xl font-bold text-red-800">{gameResults.losses}</div>
                </div>

                <div className="bg-gray-50 rounded-md p-4 text-center">
                  <div className="text-sm text-gray-600">Draws</div>
                  <div className="text-3xl font-bold text-gray-800">{gameResults.draws}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opponent</th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {games
                      .filter(game => game.isCompleted)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(game => {
                        let result = "Draw";
                        let resultClass = "text-gray-800";

                        if (game.homeScore > game.awayScore) {
                          result = "Win";
                          resultClass = "text-green-800";
                        } else if (game.homeScore < game.awayScore) {
                          result = "Loss";
                          resultClass = "text-red-800";
                        }

                        return (
                          <tr key={game.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              {new Date(game.date).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap font-medium">
                              {game.opponent}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                              {game.location}
                            </td>
                            <td className={`px-3 py-2 whitespace-nowrap text-center font-medium ${resultClass}`}>
                              {result}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              {game.homeScore} - {game.awayScore}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}