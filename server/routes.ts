import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Router } from "express";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertPlayerSchema,
  insertGameSchema,
  insertGamePlayerSchema,
  insertStatSchema,
  insertStatTypeSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create router for API routes
  const apiRouter = Router();

  // Players API
  apiRouter.get("/players", async (req: Request, res: Response) => {
    try {
      const players = await storage.getPlayers();
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  apiRouter.get("/players/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const player = await storage.getPlayer(id);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  apiRouter.post("/players", async (req: Request, res: Response) => {
    try {
      const validation = insertPlayerSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid player data", errors: validation.error.format() });
      }
      
      const player = await storage.createPlayer(validation.data);
      res.status(201).json(player);
    } catch (error) {
      res.status(500).json({ message: "Failed to create player" });
    }
  });

  apiRouter.put("/players/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validation = insertPlayerSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid player data", errors: validation.error.format() });
      }
      
      const player = await storage.updatePlayer(id, validation.data);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Failed to update player" });
    }
  });

  apiRouter.delete("/players/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deletePlayer(id);
      
      if (!success) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

  // Games API
  apiRouter.get("/games", async (req: Request, res: Response) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  apiRouter.get("/games/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const game = await storage.getGame(id);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  apiRouter.post("/games", async (req: Request, res: Response) => {
    try {
      const validation = insertGameSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid game data", errors: validation.error.format() });
      }
      
      const game = await storage.createGame(validation.data);
      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  apiRouter.put("/games/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validation = insertGameSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid game data", errors: validation.error.format() });
      }
      
      const game = await storage.updateGame(id, validation.data);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  apiRouter.post("/games/:id/complete", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const completeGameSchema = z.object({
        homeScore: z.number(),
        awayScore: z.number(),
        playerOfMatchId: z.number().optional(),
        playerOfMatchComment: z.string().optional()
      });
      
      const validation = completeGameSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid completion data", errors: validation.error.format() });
      }
      
      const { homeScore, awayScore, playerOfMatchId, playerOfMatchComment } = validation.data;
      
      const game = await storage.completeGame(id, homeScore, awayScore, playerOfMatchId, playerOfMatchComment);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete game" });
    }
  });

  apiRouter.delete("/games/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteGame(id);
      
      if (!success) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // GamePlayers API
  apiRouter.get("/games/:id/players", async (req: Request, res: Response) => {
    try {
      const gameId = Number(req.params.id);
      const gamePlayers = await storage.getGamePlayers(gameId);
      res.json(gamePlayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game players" });
    }
  });

  apiRouter.post("/games/:id/players", async (req: Request, res: Response) => {
    try {
      const gameId = Number(req.params.id);
      const gamePlayerData = { ...req.body, gameId };
      
      const validation = insertGamePlayerSchema.safeParse(gamePlayerData);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid game player data", errors: validation.error.format() });
      }
      
      const gamePlayer = await storage.createGamePlayer(validation.data);
      res.status(201).json(gamePlayer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create game player" });
    }
  });

  apiRouter.post("/games/:id/substitutions", async (req: Request, res: Response) => {
    try {
      const gameId = Number(req.params.id);
      const substitutionSchema = z.object({
        outPlayerId: z.number(),
        inPlayerId: z.number(),
        time: z.number()
      });
      
      const validation = substitutionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid substitution data", errors: validation.error.format() });
      }
      
      const { outPlayerId, inPlayerId, time } = validation.data;
      
      const success = await storage.substitutePlayer(gameId, outPlayerId, inPlayerId, time);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to substitute player" });
      }
      
      res.status(200).json({ message: "Substitution completed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to substitute player" });
    }
  });

  // Stats API
  apiRouter.get("/games/:id/stats", async (req: Request, res: Response) => {
    try {
      const gameId = Number(req.params.id);
      const stats = await storage.getGameStats(gameId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game stats" });
    }
  });

  apiRouter.get("/games/:gameId/players/:playerId/stats", async (req: Request, res: Response) => {
    try {
      const gameId = Number(req.params.gameId);
      const playerId = Number(req.params.playerId);
      const stats = await storage.getPlayerGameStats(gameId, playerId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch player game stats" });
    }
  });

  apiRouter.post("/stats", async (req: Request, res: Response) => {
    try {
      const validation = insertStatSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid stat data", errors: validation.error.format() });
      }
      
      const stat = await storage.createStat(validation.data);
      res.status(201).json(stat);
    } catch (error) {
      res.status(500).json({ message: "Failed to create stat" });
    }
  });

  // StatTypes API
  apiRouter.get("/stat-types", async (req: Request, res: Response) => {
    try {
      const statTypes = await storage.getStatTypes();
      res.json(statTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stat types" });
    }
  });

  apiRouter.post("/stat-types", async (req: Request, res: Response) => {
    try {
      const validation = insertStatTypeSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid stat type data", errors: validation.error.format() });
      }
      
      const statType = await storage.createStatType(validation.data);
      res.status(201).json(statType);
    } catch (error) {
      res.status(500).json({ message: "Failed to create stat type" });
    }
  });
  
  // Mount the router to the app
  app.use('/api', apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
