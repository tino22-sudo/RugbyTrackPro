export interface Player {
  id: number;
  name: string;
  number?: number;
  position?: string;
  isActive: boolean;
}

export interface Game {
  id: number;
  opponent: string;
  date: string;
  location: string;
  halfLength: number;
  numberOfHalves: number;
  homeScore: number;
  awayScore: number;
  isCompleted: boolean;
  playerOfMatchId?: number;
  playerOfMatchComment?: string;
}

export interface GamePlayer {
  id: number;
  gameId: number;
  playerId: number;
  number: number;
  position: string;
  isStarter: boolean;
  startTime?: number;
  endTime?: number;
}

export interface PlayerWithPosition extends Player {
  gamePlayerId: number;
  number: number;
  position: string;
  isStarter: boolean;
  startTime?: number;
  endTime?: number;
}

export interface Stat {
  id: number;
  gameId: number;
  playerId: number;
  statType: string;
  value: number;
  gameTime?: number;
  period?: number;
}

export interface StatType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  color: string;
  icon: string;
}

export interface PlayerStat {
  playerId: number;
  playerName: string;
  playerNumber: number;
  playerPosition: string;
  statType: string;
  total: number;
}

export interface TimerState {
  isRunning: boolean;
  currentHalf: number;
  currentTime: number;
  halfLength: number;
  numberOfHalves: number;
}

export interface SubstitutionData {
  outPlayerId: number;
  inPlayerId: number;
  time: number;
}

export interface GameSummary {
  game: Game;
  players: PlayerWithPosition[];
  stats: Stat[];
  playerStats: PlayerStat[];
  totalStats: Record<string, number>;
}

export interface ActivityLog {
  id: number;
  time: number;
  playerId: number;
  playerNumber: number;
  playerName: string;
  statType: string;
  value: number;
}
