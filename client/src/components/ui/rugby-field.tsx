import { useState, useEffect } from 'react';

interface RugbyFieldProps {
  className?: string;
}

export function RugbyField({ className = '' }: RugbyFieldProps) {
  return (
    <div className={`relative w-full aspect-[2/1] bg-green-600 rounded-md overflow-hidden ${className}`}>
      {/* Field markings */}
      <div className="absolute inset-0">
        {/* Center line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white transform -translate-x-1/2"></div>
        
        {/* 22m lines */}
        <div className="absolute top-0 bottom-0 left-[22%] w-1 bg-white"></div>
        <div className="absolute top-0 bottom-0 left-[78%] w-1 bg-white"></div>
        
        {/* 5m lines */}
        <div className="absolute top-0 bottom-0 left-[5%] w-0.5 bg-white"></div>
        <div className="absolute top-0 bottom-0 left-[95%] w-0.5 bg-white"></div>
        
        {/* Try lines */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-white"></div>
        <div className="absolute top-0 bottom-0 right-0 w-1 bg-white"></div>
        
        {/* In-goal areas */}
        <div className="absolute top-0 bottom-0 left-0 w-[5%] bg-green-700 opacity-30"></div>
        <div className="absolute top-0 bottom-0 right-0 w-[5%] bg-green-700 opacity-30"></div>
      </div>
      
      {/* Logo/Watermark */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-opacity-10 text-3xl font-bold">
        RUGBY STATS
      </div>
    </div>
  );
}

export default RugbyField;
