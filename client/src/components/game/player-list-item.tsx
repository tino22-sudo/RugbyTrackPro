import { useState } from 'react';
import { PlayerWithPosition } from '@/types';
import { cn } from '@/lib/utils';

interface PlayerListItemProps {
  player: PlayerWithPosition;
  onClick: (player: PlayerWithPosition) => void;
  isSelected?: boolean;
  stat?: { type: string; value: number };
}

// Helper function to get the color class based on stat type
const getStatBadgeStyle = (statType: string) => {
  switch(statType) {
    case 'Try':
      return 'bg-purple-100 text-purple-800';
    case 'Conversion':
    case 'Penalty Goal': 
      return 'bg-red-100 text-red-800';
    case 'Field Goal':
      return 'bg-orange-100 text-orange-800';
    case 'Yellow Card':
      return 'bg-yellow-100 text-yellow-800';
    case 'Red Card':
      return 'bg-red-100 text-red-800';
    case 'Tackles':
      return 'bg-blue-100 text-blue-800';
    case 'Carries':
    case 'Meters':
      return 'bg-green-100 text-green-800';
    case 'Passes':
      return 'bg-indigo-100 text-indigo-800';
    case 'Penalty Conceded':
    case 'Error':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

// Helper function to get the icon based on stat type
const getStatIcon = (statType: string) => {
  switch(statType) {
    case 'Try':
      return 'emoji_events';
    case 'Conversion':
      return 'sports_soccer';
    case 'Penalty Goal':
      return 'gps_fixed';
    case 'Field Goal':
      return 'sports';
    case 'Yellow Card':
    case 'Red Card':
      return 'credit_card';
    case 'Tackles':
      return 'sports_kabaddi';
    case 'Carries':
      return 'directions_run';
    case 'Meters':
      return 'straighten';
    case 'Passes':
      return 'sports_handball';
    case 'Penalty Conceded':
      return 'flag';
    case 'Error':
      return 'error';
    default:
      return 'sports';
  }
};

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
          <div className={`text-sm flex items-center gap-1 px-2 py-0.5 rounded-full ${getStatBadgeStyle(stat.type)}`}>
            <span className="material-icons text-xs">{getStatIcon(stat.type)}</span>
            <span>{stat.value}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerListItem;
