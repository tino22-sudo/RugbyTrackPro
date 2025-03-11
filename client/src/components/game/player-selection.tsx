import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Player } from '@/types';

interface PlayerSelectionProps {
  position: string;
  positionNumber: number;
  availablePlayers: Player[];
  onChange: (positionNumber: number, playerId: number) => void;
  selectedPlayerId?: number;
}

export function PlayerSelection({ 
  position, 
  positionNumber, 
  availablePlayers,
  onChange,
  selectedPlayerId
}: PlayerSelectionProps) {
  const handleChange = (value: string) => {
    const playerId = Number(value);
    onChange(positionNumber, playerId);
  };
  
  return (
    <div className="border rounded-md p-3 bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="font-medium inline-block w-8 h-8 bg-primary text-white rounded-full text-center leading-8 mr-2">
            {positionNumber}
          </span>
          <span className="font-medium">{position}</span>
        </div>
      </div>
      
      <div className="flex items-center mt-1">
        <Select onValueChange={handleChange} value={selectedPlayerId?.toString() || ""}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select player..." />
          </SelectTrigger>
          <SelectContent>
            {availablePlayers.map((player) => (
              <SelectItem key={player.id} value={player.id.toString()}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default PlayerSelection;
