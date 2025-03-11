import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Router } from "express";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertTeamSchema,
  insertPlayerSchema,
  insertFixtureSchema,
  insertGameSchema,
  insertGamePlayerSchema,
  insertStatSchema,
  insertStatTypeSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create router for API routes
  const apiRouter = Router();

  // Teams API
  apiRouter.get("/teams", async (req: Request, res: Response) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  apiRouter.get("/teams/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const team = await storage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  apiRouter.post("/teams", async (req: Request, res: Response) => {
    try {
      const validation = insertTeamSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid team data", errors: validation.error.format() });
      }
      
      const team = await storage.createTeam(validation.data);
      res.status(201).json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  apiRouter.put("/teams/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validation = insertTeamSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid team data", errors: validation.error.format() });
      }
      
      const team = await storage.updateTeam(id, validation.data);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  apiRouter.delete("/teams/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteTeam(id);
      
      if (!success) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  apiRouter.get("/teams/:id/players", async (req: Request, res: Response) => {
    try {
      const teamId = Number(req.params.id);
      const players = await storage.getPlayersByTeam(teamId);
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team players" });
    }
  });

  apiRouter.get("/teams/:id/fixtures", async (req: Request, res: Response) => {
    try {
      const teamId = Number(req.params.id);
      const fixtures = await storage.getTeamFixtures(teamId);
      res.json(fixtures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team fixtures" });
    }
  });

  apiRouter.get("/teams/:id/games", async (req: Request, res: Response) => {
    try {
      const teamId = Number(req.params.id);
      const games = await storage.getTeamGames(teamId);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team games" });
    }
  });

  // Fixtures API
  apiRouter.get("/fixtures", async (req: Request, res: Response) => {
    try {
      const fixtures = await storage.getFixtures();
      res.json(fixtures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fixtures" });
    }
  });

  apiRouter.get("/fixtures/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const fixture = await storage.getFixture(id);
      
      if (!fixture) {
        return res.status(404).json({ message: "Fixture not found" });
      }
      
      res.json(fixture);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fixture" });
    }
  });

  apiRouter.post("/fixtures", async (req: Request, res: Response) => {
    try {
      // Create a custom validation schema that handles the date as a string
      const fixtureCreateSchema = z.object({
        teamId: z.number(),
        opponent: z.string(),
        location: z.string(),
        date: z.string().transform(val => new Date(val)),
        isHome: z.boolean().optional(),
        notes: z.string().optional()
      });
      
      const validation = fixtureCreateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid fixture data", errors: validation.error.format() });
      }
      
      const fixture = await storage.createFixture(validation.data);
      res.status(201).json(fixture);
    } catch (error) {
      res.status(500).json({ message: "Failed to create fixture" });
    }
  });

  apiRouter.put("/fixtures/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validation = insertFixtureSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid fixture data", errors: validation.error.format() });
      }
      
      const fixture = await storage.updateFixture(id, validation.data);
      
      if (!fixture) {
        return res.status(404).json({ message: "Fixture not found" });
      }
      
      res.json(fixture);
    } catch (error) {
      res.status(500).json({ message: "Failed to update fixture" });
    }
  });

  apiRouter.delete("/fixtures/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteFixture(id);
      
      if (!success) {
        return res.status(404).json({ message: "Fixture not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete fixture" });
    }
  });

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
      console.log('Game creation request body:', JSON.stringify(req.body));
      
      // Create a custom validation schema that handles the date as a string
      const gameCreateSchema = z.object({
        opponent: z.string(),
        location: z.string(),
        date: z.string().transform(val => new Date(val)),
        halfLength: z.number(),
        numberOfHalves: z.number()
      });
      
      const validation = gameCreateSchema.safeParse(req.body);
      
      if (!validation.success) {
        console.error('Game validation error:', JSON.stringify(validation.error.format()));
        return res.status(400).json({ message: "Invalid game data", errors: validation.error.format() });
      }
      
      const game = await storage.createGame(validation.data);
      res.status(201).json(game);
    } catch (error) {
      console.error('Game creation error:', error);
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
