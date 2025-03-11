import { useState } from 'react';
import { PlayerWithPosition } from '@/types';
import { cn } from '@/lib/utils';

interface PlayerListItemProps {
  player: PlayerWithPosition;
  onClick: (player: PlayerWithPosition) => void;
  isSelected?: boolean;
  stat?: { type: string; value: number };
}

export function PlayerListItem({ player, onClick, isSelected = false, stat }: PlayerListItemProps) {
  const handleClick = () => {
    onClick(player);
  };
  
  return (
    <div 
      className={cn(
        "p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer border-l-4",
        isSelected ? "border-primary bg-blue-50" : "border-transparent"
      )}
      onClick={handleClick}
    >
      <div className="font-medium w-7 h-7 bg-primary text-white rounded-full text-center leading-7">
        {player.number}
      </div>
      <div className="flex-1">
        <div className="font-medium">{player.name}</div>
        <div className="text-xs text-gray-500">{player.position}</div>
      </div>
      {stat && (
        <div>
          <div className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            <span>{stat.value}</span> {stat.type.substring(0, 3).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerListItem;
