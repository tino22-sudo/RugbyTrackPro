import { Button } from "@/components/ui/button";
import { StatType } from '@/types';

interface StatButtonProps {
  statType: StatType;
  onClick: (statType: StatType) => void;
  showValueInput?: boolean;
}

export function StatButton({ statType, onClick, showValueInput = false }: StatButtonProps) {
  const handleClick = () => {
    onClick(statType);
  };
  
  // Custom style based on the stat type's color
  const bgColorStyle = {
    backgroundColor: statType.color,
  };
  
  const hoverColorStyle = {
    backgroundColor: statType.color,
    filter: 'brightness(110%)',
  };
  
  return (
    <Button
      className="p-4 rounded-lg shadow flex flex-col items-center justify-center transition-colors h-auto w-full"
      style={bgColorStyle}
      onClick={handleClick}
    >
      <span className="material-icons text-3xl mb-2">{statType.icon}</span>
      <span className="font-medium">{statType.name}</span>
      {showValueInput && (
        <span className="text-xs text-yellow-200 mt-1">Tap to enter amount</span>
      )}
    </Button>
  );
}

export default StatButton;
