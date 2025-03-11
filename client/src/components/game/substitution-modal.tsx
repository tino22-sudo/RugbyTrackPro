import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerWithPosition, Player, SubstitutionData } from '@/types';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlayers: PlayerWithPosition[];
  benchPlayers: Player[];
  onSubstitute: (data: SubstitutionData) => void;
  currentTime: number;
}

export function SubstitutionModal({ 
  isOpen, 
  onClose, 
  activePlayers, 
  benchPlayers,
  onSubstitute,
  currentTime
}: SubstitutionModalProps) {
  const [outPlayerId, setOutPlayerId] = useState<number | null>(null);
  const [inPlayerId, setInPlayerId] = useState<number | null>(null);
  const [outPlayer, setOutPlayer] = useState<PlayerWithPosition | null>(null);
  
  // Reset selections when modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      setOutPlayerId(null);
      setInPlayerId(null);
      setOutPlayer(null);
    }
  }, [isOpen]);
  
  // Update outPlayer when outPlayerId changes
  useEffect(() => {
    if (outPlayerId) {
      const player = activePlayers.find(p => p.id === outPlayerId) || null;
      setOutPlayer(player);
    } else {
      setOutPlayer(null);
    }
  }, [outPlayerId, activePlayers]);
  
  const handleSubmit = () => {
    if (outPlayerId && inPlayerId) {
      onSubstitute({
        outPlayerId,
        inPlayerId,
        time: currentTime
      });
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Player Substitution</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player Going Off</label>
            <Select onValueChange={(value) => setOutPlayerId(Number(value))} value={outPlayerId?.toString() || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select player to substitute..." />
              </SelectTrigger>
              <SelectContent>
                {activePlayers.map((player) => (
                  <SelectItem key={player.id} value={player.id.toString()}>
                    #{player.number} {player.name} ({player.position})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {outPlayer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player Coming On</label>
              <Select onValueChange={(value) => setInPlayerId(Number(value))} value={inPlayerId?.toString() || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select replacement player..." />
                </SelectTrigger>
                <SelectContent>
                  {benchPlayers.map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="mt-4 bg-blue-50 p-3 rounded text-sm">
                <p className="font-medium text-blue-800">Position Details</p>
                <p className="text-gray-600">
                  The selected player will take position #{outPlayer.number} ({outPlayer.position})
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!outPlayerId || !inPlayerId}
          >
            Confirm Substitution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SubstitutionModal;
