import { create } from 'zustand';
import { Player, PlayerWithPosition, GamePlayer } from '@/types';
import { apiRequest } from '@/lib/queryClient';

interface PlayerState {
  // Player collections
  players: Player[];
  gamePlayers: PlayerWithPosition[];
  activePlayers: PlayerWithPosition[];
  benchPlayers: Player[];
  
  // Selected player for tracking
  selectedPlayer: PlayerWithPosition | null;
  
  // Status
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPlayers: (players: Player[]) => void;
  setGamePlayers: (gamePlayers: PlayerWithPosition[]) => void;
  selectPlayer: (playerId: number) => void;
  clearSelectedPlayer: () => void;
  
  // Game player management
  assignPlayerToPosition: (playerId: number, position: string, number: number, gameId: number) => Promise<void>;
  substitutePlayer: (gameId: number, outPlayerId: number, inPlayerId: number, time: number) => Promise<boolean>;
  
  // Data loading
  loadPlayersForGame: (gameId: number) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  players: [],
  gamePlayers: [],
  activePlayers: [],
  benchPlayers: [],
  selectedPlayer: null,
  isLoading: false,
  error: null,
  
  // Set all players
  setPlayers: (players: Player[]) => set({ players }),
  
  // Set game players and calculate active and bench players
  setGamePlayers: (gamePlayers: PlayerWithPosition[]) => {
    const activePlayers = gamePlayers.filter(gp => !gp.endTime);
    
    // Calculate bench players (all players not active in game)
    const activePlayerIds = new Set(activePlayers.map(p => p.id));
    const benchPlayers = get().players.filter(p => !activePlayerIds.has(p.id));
    
    set({ gamePlayers, activePlayers, benchPlayers });
  },
  
  // Select a player for stat tracking
  selectPlayer: (playerId: number) => {
    const player = get().activePlayers.find(p => p.id === playerId) || null;
    set({ selectedPlayer: player });
  },
  
  // Clear selected player
  clearSelectedPlayer: () => set({ selectedPlayer: null }),
  
  // Assign a player to a position in a game
  assignPlayerToPosition: async (playerId: number, position: string, number: number, gameId: number) => {
    try {
      set({ isLoading: true, error: null });
      
      const gamePlayerData: Omit<GamePlayer, 'id'> = {
        gameId,
        playerId,
        position,
        number,
        isStarter: number <= 15, // Players 1-15 are starters
        startTime: 0, // Start at beginning of game
        endTime: null // No end time yet
      };
      
      const response = await apiRequest('POST', `/api/games/${gameId}/players`, gamePlayerData);
      const newGamePlayer = await response.json();
      
      // Update the local state with the new game player
      set(state => ({
        gamePlayers: [...state.gamePlayers, newGamePlayer],
        isLoading: false
      }));
      
      // Recalculate active and bench players
      get().loadPlayersForGame(gameId);
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  },
  
  // Substitute a player during a game
  substitutePlayer: async (gameId: number, outPlayerId: number, inPlayerId: number, time: number) => {
    try {
      set({ isLoading: true, error: null });
      
      const substitutionData = {
        outPlayerId,
        inPlayerId,
        time
      };
      
      const response = await apiRequest('POST', `/api/games/${gameId}/substitutions`, substitutionData);
      
      if (!response.ok) {
        throw new Error('Failed to substitute player');
      }
      
      // Reload players for the game to get updated data
      await get().loadPlayersForGame(gameId);
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      return false;
    }
  },
  
  // Load all players and game players for a specific game
  loadPlayersForGame: async (gameId: number) => {
    try {
      set({ isLoading: true, error: null });
      
      // Load all players
      const playersResponse = await fetch('/api/players');
      if (!playersResponse.ok) throw new Error('Failed to load players');
      const players = await playersResponse.json();
      
      // Load game players
      const gamePlayersResponse = await fetch(`/api/games/${gameId}/players`);
      if (!gamePlayersResponse.ok) throw new Error('Failed to load game players');
      const gamePlayers = await gamePlayersResponse.json();
      
      // Combine player data with game player data to create PlayerWithPosition objects
      const playersWithPositions: PlayerWithPosition[] = gamePlayers.map((gp: GamePlayer) => {
        const player = players.find((p: Player) => p.id === gp.playerId);
        if (!player) {
          // Create a minimal player if not found
          return {
            id: gp.playerId,
            name: `Player #${gp.playerId}`,
            isActive: true,
            gamePlayerId: gp.id,
            number: gp.number,
            position: gp.position,
            isStarter: gp.isStarter,
            startTime: gp.startTime,
            endTime: gp.endTime
          };
        }
        
        return {
          ...player,
          gamePlayerId: gp.id,
          number: gp.number,
          position: gp.position,
          isStarter: gp.isStarter,
          startTime: gp.startTime,
          endTime: gp.endTime
        };
      });
      
      // Set players and game players
      set({ players, isLoading: false });
      get().setGamePlayers(playersWithPositions);
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }
}));
