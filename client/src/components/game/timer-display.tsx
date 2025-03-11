import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { TimerState } from '@/types';
import { Card } from "@/components/ui/card";

interface TimerDisplayProps {
  initialState: TimerState;
  onPause: () => void;
  onResume: () => void;
  onNextHalf: () => void;
  onGameEnd: () => void;
}

export function TimerDisplay({ 
  initialState, 
  onPause,
  onResume, 
  onNextHalf, 
  onGameEnd 
}: TimerDisplayProps) {
  const [timerState, setTimerState] = useState<TimerState>(initialState);
  const [displayTime, setDisplayTime] = useState('');
  
  // Format the timer display
  const formatTime = useCallback((timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Calculate half name based on number of halves
  const getHalfName = useCallback((half: number, totalHalves: number) => {
    if (totalHalves === 2) {
      return half === 1 ? "First Half" : "Second Half";
    } else if (totalHalves === 4) {
      const quarterNames = ["First Quarter", "Second Quarter", "Third Quarter", "Fourth Quarter"];
      return quarterNames[half - 1] || `Period ${half}`;
    }
    return `Period ${half}`;
  }, []);
  
  // Timer tick function
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerState.isRunning) {
      interval = setInterval(() => {
        setTimerState(prev => {
          const newTime = Math.max(0, prev.currentTime - 1);
          return { ...prev, currentTime: newTime };
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isRunning]);
  
  // Handle timer display and state updates
  useEffect(() => {
    // Update the display time
    setDisplayTime(formatTime(timerState.currentTime));
    
    // Check if current half is finished
    if (timerState.currentTime <= 0 && timerState.isRunning) {
      setTimerState(prev => ({ ...prev, isRunning: false }));
      
      if (timerState.currentHalf >= timerState.numberOfHalves) {
        // Game is over
        onGameEnd();
      }
    }
  }, [timerState, formatTime, onGameEnd]);
  
  // Handle pause/resume button click
  const handlePlayPauseClick = () => {
    if (timerState.isRunning) {
      setTimerState(prev => ({ ...prev, isRunning: false }));
      onPause();
    } else {
      setTimerState(prev => ({ ...prev, isRunning: true }));
      onResume();
    }
  };
  
  // Handle next half button click
  const handleNextHalfClick = () => {
    if (timerState.currentHalf < timerState.numberOfHalves) {
      setTimerState(prev => ({
        ...prev,
        currentHalf: prev.currentHalf + 1,
        currentTime: prev.halfLength * 60,
        isRunning: false
      }));
      onNextHalf();
    } else {
      // Game is complete
      onGameEnd();
    }
  };
  
  const halfName = getHalfName(timerState.currentHalf, timerState.numberOfHalves);
  const isLastHalf = timerState.currentHalf >= timerState.numberOfHalves;
  
  return (
    <div className="w-full bg-primary-dark px-4 py-3 flex items-center justify-between">
      <div>
        <span className="text-sm font-medium text-blue-200">Current Half</span>
        <div className="flex items-center">
          <span className="material-icons text-yellow-400 mr-1">flag</span>
          <span className="font-medium">{halfName}</span>
        </div>
      </div>
      
      <div className="text-center">
        <div className="timer-display text-3xl font-bold">{displayTime}</div>
        <div className="text-xs text-blue-200">Time Remaining</div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="bg-white bg-opacity-20 hover:bg-opacity-30"
          onClick={handlePlayPauseClick}
        >
          <span className="material-icons">
            {timerState.isRunning ? 'pause' : 'play_arrow'}
          </span>
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex items-center"
          onClick={handleNextHalfClick}
        >
          <span className="material-icons mr-1">skip_next</span>
          <span className="text-sm">{isLastHalf ? 'End Game' : 'Next Half'}</span>
        </Button>
      </div>
    </div>
  );
}

export default TimerDisplay;
