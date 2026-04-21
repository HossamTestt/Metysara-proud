import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { RefreshCcw } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const maxPull = 120;
  const triggerPull = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling) return;
    const y = e.touches[0].clientY;
    const distance = y - startY;

    if (distance > 0 && window.scrollY === 0) {
      // Prevent default scrolling when pulling down at the top
      if (e.cancelable) e.preventDefault();
      setCurrentY(Math.min(distance, maxPull));
    } else {
      setPulling(false);
      setCurrentY(0);
    }
  };

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);

    if (currentY >= triggerPull) {
      setRefreshing(true);
      setCurrentY(60); // Hold spinner at 60px height
      
      if (onRefresh) {
        await onRefresh();
      } else {
        // Default refresh action
        window.location.reload();
      }
      
      setRefreshing(false);
      setCurrentY(0);
    } else {
      setCurrentY(0);
    }
  }, [currentY, pulling, onRefresh]);

  useEffect(() => {
    // We add passive false to touchmove to allow preventDefault if needed
    const options = { passive: false };
    const container = document.getElementById('ptr-container');
    if (!container) return;

    const touchMove = (e: Event) => {
      const te = e as TouchEvent;
      if (pulling && window.scrollY === 0 && te.touches[0].clientY > startY) {
         if (e.cancelable) e.preventDefault();
      }
    };

    container.addEventListener('touchmove', touchMove, options as any);
    return () => container.removeEventListener('touchmove', touchMove, options as any);
  }, [pulling, startY]);

  return (
    <div 
      id="ptr-container"
      className="relative w-full h-full min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh Indicator */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center items-end bg-transparent z-50 overflow-hidden transition-all duration-200"
        style={{ 
           height: `${currentY}px`,
           opacity: currentY / maxPull
        }}
      >
        <div className={`mb-4 p-2 bg-white rounded-full shadow-lg ${refreshing ? 'animate-spin' : ''}`}>
           <RefreshCcw className="h-6 w-6 text-primary" style={{ transform: `rotate(${currentY * 3}deg)` }} />
        </div>
      </div>

      {/* Content */}
      <div 
        className="w-full h-full bg-background transition-transform duration-200"
        style={{ transform: `translateY(${refreshing ? 60 : currentY / 2}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
