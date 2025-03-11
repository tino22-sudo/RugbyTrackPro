import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Game, Player, StatType } from '@/types';
import { PlayerSelection } from '@/components/game/player-selection';

export default function PlayerSetup() {
  const params = useParams();
  const gameId = Number(params.gameId);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [positionSelections, setPositionSelections] = useState<Record<number, number>>({});
  const [selectedStats, setSelectedStats] = useState<Record<number, boolean>>({});
  const [customStat, setCustomStat] = useState('');
  const [additionalSubstitutes, setAdditionalSubstitutes] = useState<Array<{ number: number, position: string }>>([]);
  
  // Fetch the game data
  const { data: game, isLoading: isLoadingGame } = useQuery<Game>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });
  
  // Fetch all players
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });
  
  // Fetch stat types
  const { data: statTypes = [], isLoading: isLoadingStatTypes } = useQuery<StatType[]>({
    queryKey: ['/api/stat-types'],
  });
  
  // Initialize selected stats based on defaults
  useEffect(() => {
    if (statTypes.length > 0) {
      const initialStatSelections = statTypes.reduce((acc, statType) => {
        acc[statType.id] = statType.isDefault;
        return acc;
      }, {} as Record<number, boolean>);
      
      setSelectedStats(initialStatSelections);
    }
  }, [statTypes]);
  
  // Positions for rugby league
  const rugbyPositions = [
    // Backs
    { number: 1, position: "Fullback" },
    { number: 2, position: "Right Wing" },
    { number: 3, position: "Right Centre" },
    { number: 4, position: "Left Centre" },
    { number: 5, position: "Left Wing" },
    { number: 6, position: "Stand Off" },
    { number: 7, position: "Scrum Half / Half Back" },
    // Forwards
    { number: 8, position: "Prop" },
    { number: 9, position: "Hooker" },
    { number: 10, position: "Prop" },
    { number: 11, position: "Second Row" },
    { number: 12, position: "Second Row" },
    { number: 13, position: "Loose Forward" },
    // Substitutes
    { number: 14, position: "Substitute" },
    { number: 15, position: "Substitute" },
    { number: 16, position: "Substitute" },
    { number: 17, position: "Substitute" }
  ];
  
  // Forwards (8-13)
  const forwards = rugbyPositions.filter(p => p.number >= 8 && p.number <= 13);
  
  // Backs (1-7)
  const backs = rugbyPositions.filter(p => p.number >= 1 && p.number <= 7);
  
  // Get the base substitutes (14-17)
  const baseSubstitutes = rugbyPositions.filter(p => p.number >= 14);
  
  // All substitutes (including additional ones)
  const substitutes = [...baseSubstitutes, ...additionalSubstitutes];
  
  // Add additional substitute
  const handleAddSubstitute = () => {
    // Find the highest existing number
    const highestNumber = Math.max(
      ...rugbyPositions.map(p => p.number),
      ...additionalSubstitutes.map(p => p.number)
    );
    
    // Create a new substitute with the next number
    const newSubstitute = {
      number: highestNumber + 1,
      position: "Substitute"
    };
    
    setAdditionalSubstitutes(prev => [...prev, newSubstitute]);
  };
  
  // Handle position selection change
  const handlePositionChange = (positionNumber: number, playerId: number) => {
    setPositionSelections(prev => ({
      ...prev,
      [positionNumber]: playerId
    }));
  };
  
  // Handle stat selection change
  const handleStatChange = (statId: number, checked: boolean) => {
    setSelectedStats(prev => ({
      ...prev,
      [statId]: checked
    }));
  };
  
  // Handle adding a custom stat
  const handleAddCustomStat = () => {
    if (customStat.trim() === '') return;
    
    // Create a new stat type
    const newStatType: Omit<StatType, 'id'> = {
      name: customStat,
      description: `Custom stat: ${customStat}`,
      isActive: true,
      isDefault: false,
      color: '#1E3A8A', // Default primary color
      icon: 'sports_rugby'
    };
    
    // Call API to create the new stat type
    createStatTypeMutation.mutate(newStatType);
  };
  
  // Create game players mutation
  const savePlayersMutation = useMutation({
    mutationFn: async () => {
      const playerAssignments = Object.entries(positionSelections).map(([posNumber, playerId]) => {
        const positionNumber = Number(posNumber);
        
        // Find position name from combined list of all positions
        const allPositions = [...rugbyPositions, ...additionalSubstitutes];
        const position = allPositions.find(p => p.number === positionNumber)?.position || "Unknown";
        
        const isStarter = positionNumber <= 13; // Players 1-13 are starters in rugby league
        
        return {
          playerId,
          number: positionNumber,
          position,
          isStarter,
          gameId, // This will be sent in the URL
        };
      });
      
      // Only create players that have been assigned
      const validPlayerAssignments = playerAssignments.filter(p => p.playerId > 0);
      
      // Make API calls to create each game player
      const promises = validPlayerAssignments.map(assignment => 
        apiRequest('POST', `/api/games/${gameId}/players`, assignment)
      );
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/players`] });
      toast({
        title: "Players Assigned",
        description: "Player positions have been successfully assigned.",
      });
      
      // Navigate to the active game page
      navigate(`/active-game/${gameId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign players. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Create stat type mutation
  const createStatTypeMutation = useMutation({
    mutationFn: (statType: Omit<StatType, 'id'>) => {
      return apiRequest('POST', '/api/stat-types', statType)
        .then(res => res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stat-types'] });
      setSelectedStats(prev => ({
        ...prev,
        [data.id]: true
      }));
      setCustomStat('');
      toast({
        title: "Custom Stat Added",
        description: `The stat "${data.name}" has been added.`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add custom stat. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle start game
  const handleStartGame = () => {
    // Save player assignments first
    savePlayersMutation.mutate();
  };
  
  // Handle back button
  const handleBack = () => {
    navigate(`/new-game`);
  };
  
  if (isLoadingGame || isLoadingPlayers || isLoadingStatTypes) {
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
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-primary">Player Setup</h1>
            <p className="text-sm text-gray-500">
              vs. {game.opponent} • {new Date(game.date).toLocaleDateString()} • {game.location}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack}
          >
            <span className="material-icons mr-1">arrow_back</span>
            Back
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        {/* Position Assignment Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-heading font-bold text-primary mb-4">Assign Players</h2>
            <p className="text-gray-600 mb-6">Assign players to positions for the starting lineup.</p>
            
            <Tabs defaultValue="backs">
              <TabsList className="mb-4">
                <TabsTrigger value="backs">Backs (1-7)</TabsTrigger>
                <TabsTrigger value="forwards">Forwards (8-13)</TabsTrigger>
                <TabsTrigger value="substitutes">Substitutes (14+)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="forwards" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {forwards.map(pos => (
                  <PlayerSelection
                    key={pos.number}
                    position={pos.position}
                    positionNumber={pos.number}
                    availablePlayers={players}
                    onChange={handlePositionChange}
                    selectedPlayerId={positionSelections[pos.number]}
                  />
                ))}
              </TabsContent>
              
              <TabsContent value="backs" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {backs.map(pos => (
                  <PlayerSelection
                    key={pos.number}
                    position={pos.position}
                    positionNumber={pos.number}
                    availablePlayers={players}
                    onChange={handlePositionChange}
                    selectedPlayerId={positionSelections[pos.number]}
                  />
                ))}
              </TabsContent>
              
              <TabsContent value="substitutes">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-700">Substitute Players</h3>
                  <Button 
                    onClick={handleAddSubstitute} 
                    variant="outline" 
                    className="flex items-center gap-1"
                    size="sm"
                  >
                    <span className="material-icons text-sm">add</span>
                    Add Substitute
                  </Button>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {substitutes.map(pos => (
                    <PlayerSelection
                      key={pos.number}
                      position={pos.position}
                      positionNumber={pos.number}
                      availablePlayers={players}
                      onChange={handlePositionChange}
                      selectedPlayerId={positionSelections[pos.number]}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Stats to Track Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-heading font-bold text-primary mb-3">Stats to Track</h2>
            <p className="text-gray-600 mb-4">Select which stats to track during this game.</p>
            
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {statTypes.map(statType => (
                <div key={statType.id} className="flex items-center">
                  <Checkbox 
                    id={`stat_${statType.id}`} 
                    checked={selectedStats[statType.id] || false}
                    onCheckedChange={(checked) => handleStatChange(statType.id, checked === true)}
                  />
                  <label htmlFor={`stat_${statType.id}`} className="ml-2 block text-gray-700">
                    {statType.name}
                  </label>
                </div>
              ))}
            </div>
            
            {/* Custom stat input */}
            <div className="mt-6 flex gap-3 items-center">
              <Checkbox 
                id="custom_stat_checkbox"
                checked={customStat.trim() !== ''}
                onCheckedChange={(checked) => {
                  if (!checked) setCustomStat('');
                }}
              />
              <Input 
                placeholder="Add custom stat..." 
                value={customStat}
                onChange={(e) => setCustomStat(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAddCustomStat}
                disabled={customStat.trim() === '' || createStatTypeMutation.isPending}
                className="p-2 text-primary hover:bg-gray-100 rounded-md transition-colors"
                variant="ghost"
                size="icon"
              >
                <span className="material-icons">add</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Action buttons */}
        <div className="mt-4 flex justify-end space-x-4">
          <Button 
            variant="outline"
            onClick={handleBack}
          >
            Back
          </Button>
          <Button 
            onClick={handleStartGame}
            disabled={savePlayersMutation.isPending}
            className="px-6 py-2 bg-secondary text-white rounded-md hover:bg-secondary-light transition-colors font-medium"
          >
            {savePlayersMutation.isPending ? "Starting..." : "Start Game"}
          </Button>
        </div>
      </div>
    </div>
  );
}
