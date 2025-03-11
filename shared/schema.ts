import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Players table
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  number: integer("number"),
  position: text("position"),
  isActive: boolean("is_active").default(true),
});

export const insertPlayerSchema = createInsertSchema(players).omit({ id: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  opponent: text("opponent").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  location: text("location").notNull(),
  halfLength: integer("half_length").notNull(),
  numberOfHalves: integer("number_of_halves").notNull(),
  homeScore: integer("home_score").default(0),
  awayScore: integer("away_score").default(0),
  isCompleted: boolean("is_completed").default(false),
  playerOfMatchId: integer("player_of_match_id"),
  playerOfMatchComment: text("player_of_match_comment"),
});

export const insertGameSchema = createInsertSchema(games).omit({ 
  id: true, 
  homeScore: true, 
  awayScore: true, 
  isCompleted: true,
  playerOfMatchId: true,
  playerOfMatchComment: true 
});
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

// GamePlayers table - represents players assigned to a specific game
export const gamePlayers = pgTable("game_players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  playerId: integer("player_id").notNull(),
  number: integer("number").notNull(),
  position: text("position").notNull(),
  isStarter: boolean("is_starter").default(false),
  startTime: real("start_time"), // time in minutes from game start
  endTime: real("end_time"), // time in minutes
});

export const insertGamePlayerSchema = createInsertSchema(gamePlayers).omit({ id: true });
export type InsertGamePlayer = z.infer<typeof insertGamePlayerSchema>;
export type GamePlayer = typeof gamePlayers.$inferSelect;

// Stats table - tracks all stats recorded during a game
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  playerId: integer("player_id").notNull(),
  statType: text("stat_type").notNull(), // tackles, carries, etc.
  value: integer("value").default(1), // default to 1 for boolean stats, can be higher for meters, etc.
  gameTime: real("game_time"), // time in minutes from game start
  period: integer("period").default(1), // which half/period
});

export const insertStatSchema = createInsertSchema(stats).omit({ id: true });
export type InsertStat = z.infer<typeof insertStatSchema>;
export type Stat = typeof stats.$inferSelect;

// StatTypes table - configurable stats that can be tracked
export const statTypes = pgTable("stat_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  color: text("color").default("#1E3A8A"), // Default primary color
  icon: text("icon").default("sports_rugby"),
});

export const insertStatTypeSchema = createInsertSchema(statTypes).omit({ id: true });
export type InsertStatType = z.infer<typeof insertStatTypeSchema>;
export type StatType = typeof statTypes.$inferSelect;

// Users table (for basic auth and team management)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  teamName: text("team_name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  teamName: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
