import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Game, PlayerWithPosition, Stat, PlayerStat
} from '@/types';

export default function GameSummary() {
  const params = useParams();
  const gameId = Number(params.gameId);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [playerOfMatchId, setPlayerOfMatchId] = useState<number | null>(null);
  const [playerOfMatchComment, setPlayerOfMatchComment] = useState<string>('');
  const [playerFilter, setPlayerFilter] = useState<string>('all');
  
  // Fetch the game data
  const { data: game, isLoading: isLoadingGame } = useQuery<Game>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });
  
  // Fetch game players
  const { data: gamePlayers = [], isLoading: isLoadingGamePlayers } = useQuery<PlayerWithPosition[]>({
    queryKey: [`/api/games/${gameId}/players`],
    enabled: !!gameId,
  });
  
  // Fetch game stats
  const { data: gameStats = [], isLoading: isLoadingGameStats } = useQuery<Stat[]>({
    queryKey: [`/api/games/${gameId}/stats`],
    enabled: !!gameId,
  });
  
  // Set player of match from game data if available
  useEffect(() => {
    if (game?.playerOfMatchId) {
      setPlayerOfMatchId(game.playerOfMatchId);
    }
    
    if (game?.playerOfMatchComment) {
      setPlayerOfMatchComment(game.playerOfMatchComment);
    }
  }, [game]);
  
  // Process the stats data to get player stats
  const playerStats: PlayerStat[] = [];
  const totalStats: Record<string, number> = {};
  
  // Calculate player stats and totals
  gamePlayers.forEach(player => {
    const playerStatsMap: Record<string, number> = {};
    
    // Find all stats for this player
    const stats = gameStats.filter(stat => stat.playerId === player.id);
    
    // Group stats by type and sum values
    stats.forEach(stat => {
      if (!playerStatsMap[stat.statType]) {
        playerStatsMap[stat.statType] = 0;
      }
      playerStatsMap[stat.statType] += stat.value;
      
      // Add to total stats
      if (!totalStats[stat.statType]) {
        totalStats[stat.statType] = 0;
      }
      totalStats[stat.statType] += stat.value;
    });
    
    // Add player stats to the array
    Object.entries(playerStatsMap).forEach(([statType, total]) => {
      playerStats.push({
        playerId: player.id,
        playerName: player.name,
        playerNumber: player.number,
        playerPosition: player.position,
        statType,
        total
      });
    });
  });
  
  // Filter players based on position
  const filteredPlayers = gamePlayers.filter(player => {
    if (playerFilter === 'all') return true;
    if (playerFilter === 'forwards' && player.number >= 1 && player.number <= 8) return true;
    if (playerFilter === 'backs' && player.number >= 9 && player.number <= 15) return true;
    if (playerFilter === 'substitutes' && player.number > 15) return true;
    return false;
  });
  
  // Get unique stat types
  const statTypeSet = new Set<string>();
  gameStats.forEach(stat => {
    statTypeSet.add(stat.statType);
  });
  const statTypes = Array.from(statTypeSet);
  
  // Save player of match mutation
  const savePlayerOfMatchMutation = useMutation({
    mutationFn: () => {
      return apiRequest('POST', `/api/games/${gameId}/complete`, {
        homeScore: game?.homeScore || 0,
        awayScore: game?.awayScore || 0,
        playerOfMatchId,
        playerOfMatchComment
      })
      .then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      toast({
        title: "Player of the Match Saved",
        description: "Player of the match has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update player of the match. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle player of match save
  const handleSavePlayerOfMatch = () => {
    if (playerOfMatchId) {
      savePlayerOfMatchMutation.mutate();
    }
  };
  
  // Get the player of match object
  const playerOfMatch = gamePlayers.find(player => player.id === playerOfMatchId);
  
  // Return to home
  const handleReturnHome = () => {
    navigate('/');
  };
  
  if (isLoadingGame || isLoadingGamePlayers || isLoadingGameStats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg text-red-600">Game not found. Please return to the home page.</p>
            <Button className="mt-4" onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-primary">Game Summary</h1>
            <p className="text-sm text-gray-500">
              vs. {game.opponent} • {new Date(game.date).toLocaleDateString()} • {game.location}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {}}
              className="flex items-center"
            >
              <span className="material-icons mr-1">download</span>
              Export
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReturnHome}
              className="flex items-center"
            >
              <span className="material-icons mr-1">home</span>
              Home
            </Button>
          </div>
        </div>
      </header>
      
      <div className="space-y-6">
        {/* Game Result Card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-heading font-bold text-primary mb-3">Game Result</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
                <div className="text-lg font-medium">Our Team</div>
                <div className="text-4xl font-bold text-primary mt-2">{game.homeScore}</div>
              </div>
              
              <div className="flex flex-col items-center justify-center">
                <div className="text-gray-500 mb-2">Final Score</div>
                <div className="text-2xl font-bold">vs</div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
                <div className="text-lg font-medium">{game.opponent}</div>
                <div className="text-4xl font-bold text-accent mt-2">{game.awayScore}</div>
              </div>
            </div>
            
            {/* Player of the Match */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-heading font-bold text-yellow-800 mb-2">Player of the Match</h3>
              <div className="flex items-center">
                <div>
                  <Select onValueChange={(value) => setPlayerOfMatchId(Number(value))} value={playerOfMatchId?.toString() || ""}>
                    <SelectTrigger className="w-60">
                      <SelectValue placeholder="Select player..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select player...</SelectItem>
                      {gamePlayers.map(player => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          #{player.number} {player.name} ({player.position})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="ml-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSavePlayerOfMatch}
                    disabled={!playerOfMatchId || savePlayerOfMatchMutation.isPending}
                  >
                    Save
                  </Button>
                </div>
              </div>
              
              <div className="mt-3">
                <Textarea 
                  placeholder="Add comments about the player's performance..."
                  value={playerOfMatchComment}
                  onChange={(e) => setPlayerOfMatchComment(e.target.value)}
                  className="text-sm text-gray-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Team Stats Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-heading font-bold text-primary">Team Stats</h2>
              <Button 
                variant="link" 
                className="text-primary hover:text-primary-dark transition-colors font-medium text-sm flex items-center"
                onClick={() => navigate('/dashboard')}
              >
                <span className="material-icons mr-1 text-sm">bar_chart</span>
                View Detailed Analytics
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(totalStats).slice(0, 4).map(([statType, value]) => (
                <div key={statType} className="bg-blue-50 rounded-md p-3">
                  <div className="text-sm text-gray-600">Total {statType}</div>
                  <div className="text-2xl font-bold text-blue-800">{value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Player Performance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-heading font-bold text-primary">Player Performance</h2>
              <Select 
                onValueChange={setPlayerFilter} 
                defaultValue="all"
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Players" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  <SelectItem value="forwards">Forwards</SelectItem>
                  <SelectItem value="backs">Backs</SelectItem>
                  <SelectItem value="substitutes">Substitutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    {statTypes.map(statType => (
                      <th key={statType} scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {statType}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPlayers.map(player => (
                    <tr key={player.id}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="font-medium w-6 h-6 bg-primary text-white rounded-full text-xs text-center leading-6 mr-2">
                            {player.number}
                          </div>
                          <div className="font-medium">{player.name}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{player.position}</td>
                      {statTypes.map(statType => {
                        const stat = playerStats.find(ps => ps.playerId === player.id && ps.statType === statType);
                        return (
                          <td key={`${player.id}-${statType}`} className="px-3 py-2 whitespace-nowrap text-center">
                            {stat ? stat.total : 0}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
