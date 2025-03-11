import { create } from 'zustand';
import { Game, Stat, TimerState } from '@/types';
import { apiRequest } from '@/lib/queryClient';

interface GameStats {
  [playerId: number]: {
    [statType: string]: number;
  };
}

interface GameState {
  // Current game state
  currentGame: Game | null;
  isGameActive: boolean;
  gameStats: GameStats;
  activityLog: Array<{
    id: number;
    timestamp: number;
    playerId: number;
    playerName: string;
    playerNumber: number;
    statType: string;
    value: number;
  }>;
  
  // Timer state
  timer: TimerState;
  
  // Actions
  setCurrentGame: (game: Game) => void;
  startGame: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  nextHalf: () => void;
  endGame: () => void;
  resetGame: () => void;
  updateGameState: (gameState: Partial<Game>) => void;
  
  // Stat recording
  recordStat: (playerId: number, playerName: string, playerNumber: number, statType: string, value: number) => void;
  
  // Data loading
  loadGameData: (gameId: number) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  currentGame: null,
  isGameActive: false,
  gameStats: {},
  activityLog: [],
  
  // Timer state
  timer: {
    isRunning: false,
    currentHalf: 1,
    currentTime: 2400, // Default 40 minutes in seconds
    halfLength: 40,    // Default 40 minutes
    numberOfHalves: 2  // Default 2 halves
  },
  
  // Set current game
  setCurrentGame: (game: Game) => set({ 
    currentGame: game,
    timer: {
      ...get().timer,
      currentTime: game.halfLength * 60,
      halfLength: game.halfLength,
      numberOfHalves: game.numberOfHalves
    }
  }),
  
  // Start game
  startGame: () => set({ 
    isGameActive: true,
    timer: {
      ...get().timer,
      isRunning: true
    }
  }),
  
  // Pause timer
  pauseTimer: () => set({
    timer: {
      ...get().timer,
      isRunning: false
    }
  }),
  
  // Resume timer
  resumeTimer: () => set({
    timer: {
      ...get().timer,
      isRunning: true
    }
  }),
  
  // Next half
  nextHalf: () => {
    const currentState = get();
    const nextHalf = currentState.timer.currentHalf + 1;
    
    // If we've completed all halves, end the game
    if (nextHalf > currentState.timer.numberOfHalves) {
      get().endGame();
      return;
    }
    
    // Otherwise, set up the next half
    set({
      timer: {
        ...currentState.timer,
        currentHalf: nextHalf,
        currentTime: currentState.timer.halfLength * 60,
        isRunning: false
      }
    });
  },
  
  // End game
  endGame: () => {
    const currentGame = get().currentGame;
    
    if (currentGame) {
      // Update game to completed status
      apiRequest('POST', `/api/games/${currentGame.id}/complete`, {
        homeScore: currentGame.homeScore,
        awayScore: currentGame.awayScore,
        isCompleted: true
      }).catch(error => {
        console.error('Failed to complete game:', error);
      });
    }
    
    set({
      isGameActive: false,
      timer: {
        ...get().timer,
        isRunning: false
      }
    });
  },
  
  // Reset game state
  resetGame: () => set({
    currentGame: null,
    isGameActive: false,
    gameStats: {},
    activityLog: [],
    timer: {
      isRunning: false,
      currentHalf: 1,
      currentTime: 2400,
      halfLength: 40,
      numberOfHalves: 2
    }
  }),
  
  // Update game state
  updateGameState: (gameState: Partial<Game>) => {
    const currentGame = get().currentGame;
    if (!currentGame) return;
    
    set({
      currentGame: {
        ...currentGame,
        ...gameState
      }
    });
  },
  
  // Record a stat
  recordStat: async (playerId: number, playerName: string, playerNumber: number, statType: string, value: number) => {
    const { currentGame, timer } = get();
    
    if (!currentGame) return;
    
    // Calculate game time in minutes
    const gameTime = (timer.halfLength * 60) - timer.currentTime;
    
    // Create the stat object
    const stat: Omit<Stat, 'id'> = {
      gameId: currentGame.id,
      playerId,
      statType,
      value,
      gameTime,
      period: timer.currentHalf
    };
    
    try {
      // Save to the API
      const response = await apiRequest('POST', '/api/stats', stat);
      const savedStat = await response.json();
      
      // Update local state
      set(state => {
        // Update game stats
        const gameStats = { ...state.gameStats };
        if (!gameStats[playerId]) {
          gameStats[playerId] = {};
        }
        if (!gameStats[playerId][statType]) {
          gameStats[playerId][statType] = 0;
        }
        gameStats[playerId][statType] += value;
        
        // Add to activity log
        const activityLog = [
          {
            id: Date.now(),
            timestamp: gameTime,
            playerId,
            playerName,
            playerNumber,
            statType,
            value
          },
          ...state.activityLog
        ].slice(0, 100); // Keep only the last 100 activities
        
        return { gameStats, activityLog };
      });
    } catch (error) {
      console.error('Failed to record stat:', error);
    }
  },
  
  // Load game data from the API
  loadGameData: async (gameId: number) => {
    try {
      // Fetch game
      const gameResponse = await fetch(`/api/games/${gameId}`);
      if (!gameResponse.ok) throw new Error('Failed to load game');
      const game = await gameResponse.json();
      
      // Fetch game stats
      const statsResponse = await fetch(`/api/games/${gameId}/stats`);
      if (!statsResponse.ok) throw new Error('Failed to load game stats');
      const stats = await statsResponse.json();
      
      // Process stats
      const gameStats: GameStats = {};
      stats.forEach((stat: Stat) => {
        if (!gameStats[stat.playerId]) {
          gameStats[stat.playerId] = {};
        }
        if (!gameStats[stat.playerId][stat.statType]) {
          gameStats[stat.playerId][stat.statType] = 0;
        }
        gameStats[stat.playerId][stat.statType] += stat.value;
      });
      
      // Set state
      set({
        currentGame: game,
        gameStats,
        timer: {
          isRunning: false,
          currentHalf: 1,
          currentTime: game.halfLength * 60,
          halfLength: game.halfLength,
          numberOfHalves: game.numberOfHalves
        }
      });
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  }
}));
