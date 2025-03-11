import { 
  players, 
  type Player, 
  type InsertPlayer,
  games,
  type Game,
  type InsertGame,
  gamePlayers,
  type GamePlayer,
  type InsertGamePlayer,
  stats,
  type Stat,
  type InsertStat,
  statTypes,
  type StatType,
  type InsertStatType,
  users,
  type User,
  type InsertUser
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // Player methods
  getPlayer(id: number): Promise<Player | undefined>;
  getPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined>;
  deletePlayer(id: number): Promise<boolean>;
  
  // Game methods
  getGame(id: number): Promise<Game | undefined>;
  getGames(): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined>;
  completeGame(id: number, homeScore: number, awayScore: number, playerOfMatchId?: number, playerOfMatchComment?: string): Promise<Game | undefined>;
  deleteGame(id: number): Promise<boolean>;
  
  // GamePlayer methods
  getGamePlayer(id: number): Promise<GamePlayer | undefined>;
  getGamePlayers(gameId: number): Promise<GamePlayer[]>;
  createGamePlayer(gamePlayer: InsertGamePlayer): Promise<GamePlayer>;
  updateGamePlayer(id: number, gamePlayer: Partial<InsertGamePlayer>): Promise<GamePlayer | undefined>;
  substitutePlayer(gameId: number, outPlayerId: number, inPlayerId: number, time: number): Promise<boolean>;
  deleteGamePlayer(id: number): Promise<boolean>;
  
  // Stat methods
  getStat(id: number): Promise<Stat | undefined>;
  getGameStats(gameId: number): Promise<Stat[]>;
  getPlayerStats(playerId: number): Promise<Stat[]>;
  getPlayerGameStats(gameId: number, playerId: number): Promise<Stat[]>;
  createStat(stat: InsertStat): Promise<Stat>;
  deleteStat(id: number): Promise<boolean>;
  
  // StatType methods
  getStatType(id: number): Promise<StatType | undefined>;
  getStatTypes(): Promise<StatType[]>;
  createStatType(statType: InsertStatType): Promise<StatType>;
  updateStatType(id: number, statType: Partial<InsertStatType>): Promise<StatType | undefined>;
  deleteStatType(id: number): Promise<boolean>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private players: Map<number, Player>;
  private games: Map<number, Game>;
  private gamePlayers: Map<number, GamePlayer>;
  private stats: Map<number, Stat>;
  private statTypes: Map<number, StatType>;
  private users: Map<number, User>;
  
  private currentPlayerId: number;
  private currentGameId: number;
  private currentGamePlayerId: number;
  private currentStatId: number;
  private currentStatTypeId: number;
  private currentUserId: number;

  constructor() {
    this.players = new Map();
    this.games = new Map();
    this.gamePlayers = new Map();
    this.stats = new Map();
    this.statTypes = new Map();
    this.users = new Map();
    
    this.currentPlayerId = 1;
    this.currentGameId = 1;
    this.currentGamePlayerId = 1;
    this.currentStatId = 1;
    this.currentStatTypeId = 1;
    this.currentUserId = 1;
    
    // Initialize default stat types
    this.initializeDefaultStatTypes();
  }
  
  private initializeDefaultStatTypes() {
    const defaultStatTypes: InsertStatType[] = [
      { name: "Tackles", description: "Successful tackles made", isActive: true, isDefault: true, color: "#2563EB", icon: "sports_kabaddi" },
      { name: "Carries", description: "Ball carries", isActive: true, isDefault: true, color: "#16A34A", icon: "directions_run" },
      { name: "Meters", description: "Meters gained", isActive: true, isDefault: true, color: "#CA8A04", icon: "straighten" },
      { name: "Tries", description: "Tries scored", isActive: true, isDefault: true, color: "#9333EA", icon: "emoji_events" },
      { name: "Passes", description: "Successful passes made", isActive: true, isDefault: true, color: "#4F46E5", icon: "sports_handball" },
      { name: "Lineouts", description: "Lineouts won", isActive: true, isDefault: true, color: "#DB2777", icon: "vertical_align_top" }
    ];
    
    defaultStatTypes.forEach(statType => {
      this.createStatType(statType);
    });
  }

  // Player methods
  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }
  
  async getPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }
  
  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.currentPlayerId++;
    const player: Player = { ...insertPlayer, id };
    this.players.set(id, player);
    return player;
  }
  
  async updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined> {
    const existingPlayer = this.players.get(id);
    if (!existingPlayer) return undefined;
    
    const updatedPlayer = { ...existingPlayer, ...player };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }
  
  async deletePlayer(id: number): Promise<boolean> {
    return this.players.delete(id);
  }
  
  // Game methods
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }
  
  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }
  
  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const game: Game = { 
      ...insertGame, 
      id, 
      homeScore: 0, 
      awayScore: 0, 
      isCompleted: false,
      playerOfMatchId: null,
      playerOfMatchComment: null
    };
    this.games.set(id, game);
    return game;
  }
  
  async updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined> {
    const existingGame = this.games.get(id);
    if (!existingGame) return undefined;
    
    const updatedGame = { ...existingGame, ...game };
    this.games.set(id, updatedGame);
    return updatedGame;
  }
  
  async completeGame(id: number, homeScore: number, awayScore: number, playerOfMatchId?: number, playerOfMatchComment?: string): Promise<Game | undefined> {
    const existingGame = this.games.get(id);
    if (!existingGame) return undefined;
    
    const updatedGame = { 
      ...existingGame, 
      homeScore, 
      awayScore, 
      isCompleted: true,
      playerOfMatchId: playerOfMatchId || null,
      playerOfMatchComment: playerOfMatchComment || null
    };
    
    this.games.set(id, updatedGame);
    return updatedGame;
  }
  
  async deleteGame(id: number): Promise<boolean> {
    return this.games.delete(id);
  }
  
  // GamePlayer methods
  async getGamePlayer(id: number): Promise<GamePlayer | undefined> {
    return this.gamePlayers.get(id);
  }
  
  async getGamePlayers(gameId: number): Promise<GamePlayer[]> {
    return Array.from(this.gamePlayers.values()).filter(gp => gp.gameId === gameId);
  }
  
  async createGamePlayer(insertGamePlayer: InsertGamePlayer): Promise<GamePlayer> {
    const id = this.currentGamePlayerId++;
    const gamePlayer: GamePlayer = { ...insertGamePlayer, id };
    this.gamePlayers.set(id, gamePlayer);
    return gamePlayer;
  }
  
  async updateGamePlayer(id: number, gamePlayer: Partial<InsertGamePlayer>): Promise<GamePlayer | undefined> {
    const existingGamePlayer = this.gamePlayers.get(id);
    if (!existingGamePlayer) return undefined;
    
    const updatedGamePlayer = { ...existingGamePlayer, ...gamePlayer };
    this.gamePlayers.set(id, updatedGamePlayer);
    return updatedGamePlayer;
  }
  
  async substitutePlayer(gameId: number, outPlayerId: number, inPlayerId: number, time: number): Promise<boolean> {
    // Find the outgoing player's record
    const outPlayerRecord = Array.from(this.gamePlayers.values()).find(
      gp => gp.gameId === gameId && gp.playerId === outPlayerId && !gp.endTime
    );
    
    if (!outPlayerRecord) return false;
    
    // Update the outgoing player's end time
    outPlayerRecord.endTime = time;
    this.gamePlayers.set(outPlayerRecord.id, outPlayerRecord);
    
    // Create a record for the incoming player
    const incomingPosition = outPlayerRecord.position;
    const incomingNumber = outPlayerRecord.number;
    
    const inPlayerRecord: InsertGamePlayer = {
      gameId,
      playerId: inPlayerId,
      number: incomingNumber,
      position: incomingPosition,
      isStarter: false,
      startTime: time,
      endTime: null
    };
    
    await this.createGamePlayer(inPlayerRecord);
    return true;
  }
  
  async deleteGamePlayer(id: number): Promise<boolean> {
    return this.gamePlayers.delete(id);
  }
  
  // Stat methods
  async getStat(id: number): Promise<Stat | undefined> {
    return this.stats.get(id);
  }
  
  async getGameStats(gameId: number): Promise<Stat[]> {
    return Array.from(this.stats.values()).filter(stat => stat.gameId === gameId);
  }
  
  async getPlayerStats(playerId: number): Promise<Stat[]> {
    return Array.from(this.stats.values()).filter(stat => stat.playerId === playerId);
  }
  
  async getPlayerGameStats(gameId: number, playerId: number): Promise<Stat[]> {
    return Array.from(this.stats.values()).filter(
      stat => stat.gameId === gameId && stat.playerId === playerId
    );
  }
  
  async createStat(insertStat: InsertStat): Promise<Stat> {
    const id = this.currentStatId++;
    const stat: Stat = { ...insertStat, id };
    this.stats.set(id, stat);
    return stat;
  }
  
  async deleteStat(id: number): Promise<boolean> {
    return this.stats.delete(id);
  }
  
  // StatType methods
  async getStatType(id: number): Promise<StatType | undefined> {
    return this.statTypes.get(id);
  }
  
  async getStatTypes(): Promise<StatType[]> {
    return Array.from(this.statTypes.values());
  }
  
  async createStatType(insertStatType: InsertStatType): Promise<StatType> {
    const id = this.currentStatTypeId++;
    const statType: StatType = { ...insertStatType, id };
    this.statTypes.set(id, statType);
    return statType;
  }
  
  async updateStatType(id: number, statType: Partial<InsertStatType>): Promise<StatType | undefined> {
    const existingStatType = this.statTypes.get(id);
    if (!existingStatType) return undefined;
    
    const updatedStatType = { ...existingStatType, ...statType };
    this.statTypes.set(id, updatedStatType);
    return updatedStatType;
  }
  
  async deleteStatType(id: number): Promise<boolean> {
    return this.statTypes.delete(id);
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
