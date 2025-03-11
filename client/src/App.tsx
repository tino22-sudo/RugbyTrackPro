import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/home";
import NewGame from "@/pages/new-game";
import PlayerSetup from "@/pages/player-setup";
import ActiveGame from "@/pages/active-game";
import GameSummary from "@/pages/game-summary";
import Dashboard from "@/pages/dashboard";
import GameHistory from "@/pages/game-history";
import TeamManagement from "@/pages/team-management";
import PlayerPool from "@/pages/player-pool";
import FixtureManagement from "@/pages/fixture-management";
import NotFound from "@/pages/not-found";
import MainLayout from "@/layouts/main-layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/new-game" component={NewGame} />
      <Route path="/player-setup/:gameId" component={PlayerSetup} />
      <Route path="/active-game/:gameId" component={ActiveGame} />
      <Route path="/game-summary/:gameId" component={GameSummary} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/game-history" component={GameHistory} />
      <Route path="/team-management" component={TeamManagement} />
      <Route path="/player-pool" component={PlayerPool} />
      <Route path="/fixture-management" component={FixtureManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Router />
      </MainLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
