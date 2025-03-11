import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Game, Player, PlayerWithPosition, StatType, Stat, TimerState, SubstitutionData, ActivityLog
} from '@/types';
import { TimerDisplay } from '@/components/game/timer-display';
import { PlayerListItem } from '@/components/game/player-list-item';
import { StatButton } from '@/components/game/stat-button';
import { SubstitutionModal } from '@/components/game/substitution-modal';

export default function ActiveGame() {
  const params = useParams();
  const gameId = Number(params.gameId);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Game state
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithPosition | null>(null);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [showValueInputModal, setShowValueInputModal] = useState(false);
  const [currentStatType, setCurrentStatType] = useState<StatType | null>(null);
  const [statValue, setStatValue] = useState<number>(1);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    currentHalf: 1,
    currentTime: 0, // Will be initialized with game data
    halfLength: 40, // Default, will be updated
    numberOfHalves: 2, // Default, will be updated
  });
  
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
  
  // Fetch all players for bench selection
  const { data: allPlayers = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });
  
  // Fetch stat types
  const { data: statTypes = [], isLoading: isLoadingStatTypes } = useQuery<StatType[]>({
    queryKey: ['/api/stat-types'],
  });
  
  // Filter for active players and bench players
  const activePlayers = gamePlayers.filter(player => !player.endTime);
  const benchPlayers = allPlayers.filter(player => 
    !activePlayers.some(ap => ap.id === player.id)
  );
  
  // Selected stat types only
  const activeStatTypes = statTypes.filter(st => st.isActive);
  
  // Initialize timer when game data is loaded
  useEffect(() => {
    if (game) {
      setTimerState(prev => ({
        ...prev,
        currentTime: game.halfLength * 60, // Convert to seconds
        halfLength: game.halfLength,
        numberOfHalves: game.numberOfHalves
      }));
    }
  }, [game]);
  
  // Handle player selection
  const handlePlayerSelect = (player: PlayerWithPosition) => {
    setSelectedPlayer(player);
  };
  
  // Handle stat button click
  const handleStatClick = (statType: StatType) => {
    if (!selectedPlayer) {
      toast({
        title: "No Player Selected",
        description: "Please select a player first before recording stats.",
        variant: "destructive",
      });
      return;
    }
    
    // If this stat requires a value input (like meters gained)
    if (statType.name === "Meters") {
      setCurrentStatType(statType);
      setShowValueInputModal(true);
      return;
    }
    
    // Otherwise record the stat directly
    recordStatMutation.mutate({
      gameId,
      playerId: selectedPlayer.id,
      statType: statType.name,
      value: 1,
      gameTime: (timerState.halfLength * 60) - timerState.currentTime,
      period: timerState.currentHalf
    });
  };
  
  // Handle value input submission
  const handleValueSubmit = () => {
    if (!selectedPlayer || !currentStatType) return;
    
    recordStatMutation.mutate({
      gameId,
      playerId: selectedPlayer.id,
      statType: currentStatType.name,
      value: statValue,
      gameTime: (timerState.halfLength * 60) - timerState.currentTime,
      period: timerState.currentHalf
    });
    
    setShowValueInputModal(false);
    setStatValue(1);
    setCurrentStatType(null);
  };
  
  // Handle substitution
  const handleSubstitution = (data: SubstitutionData) => {
    substitutionMutation.mutate({
      gameId,
      ...data
    });
  };
  
  // Mutation for recording stats
  const recordStatMutation = useMutation({
    mutationFn: (stat: Omit<Stat, 'id'>) => {
      return apiRequest('POST', '/api/stats', stat)
        .then(res => res.json());
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/stats`] });
      
      // Find the player to display in activity log
      const player = gamePlayers.find(p => p.id === variables.playerId);
      if (player) {
        const newActivity: ActivityLog = {
          id: Date.now(), // Using timestamp as id for simplicity
          time: variables.gameTime || 0,
          playerId: player.id,
          playerNumber: player.number,
          playerName: player.name,
          statType: variables.statType,
          value: variables.value
        };
        
        // Add to the activity logs
        setActivityLogs(prev => [newActivity, ...prev].slice(0, 10)); // Keep only the 10 most recent
      }
      
      toast({
        title: "Stat Recorded",
        description: `${variables.statType} recorded for ${selectedPlayer?.name}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record stat. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for substitutions
  const substitutionMutation = useMutation({
    mutationFn: ({ gameId, outPlayerId, inPlayerId, time }: { gameId: number } & SubstitutionData) => {
      return apiRequest('POST', `/api/games/${gameId}/substitutions`, { outPlayerId, inPlayerId, time })
        .then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/players`] });
      toast({
        title: "Substitution Complete",
        description: "The player substitution has been recorded.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record substitution. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Timer event handlers
  const handleTimerPause = () => {
    // Already handled by TimerDisplay component
  };
  
  const handleTimerResume = () => {
    // Already handled by TimerDisplay component
  };
  
  const handleNextHalf = () => {
    // Already handled by TimerDisplay component
  };
  
  const handleGameEnd = () => {
    navigate(`/game-summary/${gameId}`);
  };
  
  // Handle menu options
  const handleOpenSubstitutions = () => {
    setShowSubstitutionModal(true);
  };
  
  if (isLoadingGame || isLoadingGamePlayers || isLoadingStatTypes) {
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
  
  // Format time for display
  const formatGameTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Game Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-heading font-bold">vs. {game.opponent}</h1>
              <p className="text-sm text-blue-200">
                {new Date(game.date).toLocaleDateString()} • {game.location}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-primary-light"
                onClick={handleOpenSubstitutions}
              >
                <span className="material-icons">people</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full hover:bg-primary-light"
                onClick={() => navigate('/')}
              >
                <span className="material-icons">home</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Timer Section */}
        <TimerDisplay 
          initialState={timerState}
          onPause={handleTimerPause}
          onResume={handleTimerResume}
          onNextHalf={handleNextHalf}
          onGameEnd={handleGameEnd}
        />
      </header>

      {/* Main Game Tracking Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0">
        {/* Player List */}
        <div className="lg:col-span-1 bg-white border-r overflow-y-auto max-h-[calc(100vh-146px)] lg:max-h-[calc(100vh-146px)]">
          <div className="sticky top-0 z-10 bg-gray-100 p-3 border-b flex justify-between items-center">
            <h2 className="font-heading font-bold">Active Players</h2>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 text-primary hover:bg-gray-200 rounded"
              onClick={handleOpenSubstitutions}
            >
              <span className="material-icons">swap_horiz</span>
            </Button>
          </div>
          
          <div className="divide-y">
            {activePlayers.map(player => (
              <PlayerListItem
                key={player.gamePlayerId}
                player={player}
                onClick={handlePlayerSelect}
                isSelected={selectedPlayer?.id === player.id}
                stat={player.id === selectedPlayer?.id ? { 
                  type: "Tackles", 
                  value: 0 // This would be calculated from actual stats in a full implementation
                } : undefined}
              />
            ))}
          </div>
        </div>
        
        {/* Stat Tracking Area */}
        <div className="lg:col-span-3 p-4 bg-gray-100 overflow-y-auto max-h-[calc(100vh-146px)] lg:max-h-[calc(100vh-146px)]">
          {/* Selected Player Overview */}
          {selectedPlayer ? (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center mb-4">
                  <div className="font-heading font-bold text-xl w-10 h-10 bg-primary text-white rounded-full text-center leading-10 mr-3">
                    {selectedPlayer.number}
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl">{selectedPlayer.name}</h2>
                    <p className="text-gray-600">{selectedPlayer.position}</p>
                  </div>
                </div>
                
                {/* TODO: Implement player stats overview here */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-md p-3">
                    <div className="text-sm text-gray-600">Tackles</div>
                    <div className="text-2xl font-bold text-blue-800">0</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-md p-3">
                    <div className="text-sm text-gray-600">Carries</div>
                    <div className="text-2xl font-bold text-green-800">0</div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-md p-3">
                    <div className="text-sm text-gray-600">Meters</div>
                    <div className="text-2xl font-bold text-yellow-800">0</div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-md p-3">
                    <div className="text-sm text-gray-600">Tries</div>
                    <div className="text-2xl font-bold text-purple-800">0</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Select a player from the list to record stats</p>
              </CardContent>
            </Card>
          )}
          
          {/* Stat Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {activeStatTypes.map(statType => (
              <StatButton
                key={statType.id}
                statType={statType}
                onClick={handleStatClick}
                showValueInput={statType.name === "Meters"}
              />
            ))}
          </div>
          
          {/* Recent Activity */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-heading font-medium mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {activityLogs.length === 0 ? (
                  <p className="text-center text-gray-500 py-2">No activity recorded yet.</p>
                ) : (
                  activityLogs.map(activity => (
                    <div key={activity.id} className="flex items-center text-sm p-2 bg-gray-50 rounded-md">
                      <span className="material-icons text-blue-600 mr-2">sports_kabaddi</span>
                      <span className="font-medium mr-2">#{activity.playerNumber} {activity.playerName}</span>
                      <span>
                        {activity.statType === "Meters" 
                          ? `gained ${activity.value} meters` 
                          : `made a ${activity.statType.toLowerCase()}`}
                      </span>
                      <span className="ml-auto text-gray-500">{formatGameTime(activity.time)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Value Input Modal */}
      <Dialog open={showValueInputModal} onOpenChange={setShowValueInputModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Value</DialogTitle>
            <DialogDescription>
              {currentStatType?.name === "Meters" ? "How many meters were gained?" : "Enter value"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              type="number"
              min="1"
              value={statValue}
              onChange={(e) => setStatValue(Number(e.target.value))}
              placeholder="Enter value"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValueInputModal(false)}>Cancel</Button>
            <Button onClick={handleValueSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Substitution Modal */}
      <SubstitutionModal
        isOpen={showSubstitutionModal}
        onClose={() => setShowSubstitutionModal(false)}
        activePlayers={activePlayers}
        benchPlayers={benchPlayers}
        onSubstitute={handleSubstitution}
        currentTime={(timerState.halfLength * 60) - timerState.currentTime}
      />
    </div>
  );
}
