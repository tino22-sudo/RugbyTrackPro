import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Game } from '@/types';
import { format } from 'date-fns';
import { Link } from "wouter";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const formattedDate = format(new Date(game.date), 'MMM d, yyyy');
  
  let statusBadge;
  if (game.isCompleted) {
    statusBadge = <Badge variant="secondary" className="ml-2">Completed</Badge>;
  } else {
    statusBadge = <Badge variant="outline" className="ml-2">In Progress</Badge>;
  }
  
  return (
    <Link href={game.isCompleted ? `/game-summary/${game.id}` : `/active-game/${game.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-heading font-bold text-lg">vs. {game.opponent}</h3>
              <div className="text-sm text-gray-600 flex items-center mt-1">
                <span className="material-icons text-xs mr-1">event</span>
                <span>{formattedDate}</span>
                <span className="mx-2">•</span>
                <span className="material-icons text-xs mr-1">place</span>
                <span>{game.location}</span>
              </div>
            </div>
            {statusBadge}
          </div>
          
          {game.isCompleted && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                <span className="font-bold">Score:</span> {game.homeScore} - {game.awayScore}
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          )}
          
          {!game.isCompleted && (
            <div className="mt-4 flex justify-end">
              <Button variant="default" size="sm">
                Continue Game
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default GameCard;
