
import React, { useEffect, useRef, useState } from 'react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: number;
}

export const SlideOver: React.FC<SlideOverProps> = ({ isOpen, onClose, children, zIndex = 50 }) => {
  // Internal visibility state to handle unmount delay
  const [isVisible, setIsVisible] = useState(isOpen);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const isDragging = useRef(false);

  // --- 1. Dedicated Scroll Lock Effect ---
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // --- 2. Animation Logic ---
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Use double RAF to ensure DOM is painted before transition starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (panelRef.current) panelRef.current.style.transform = 'translateX(0%)';
          if (backdropRef.current) backdropRef.current.style.opacity = '1';
        });
      });
    } else {
      // Animate out
      if (panelRef.current) panelRef.current.style.transform = 'translateX(100%)';
      if (backdropRef.current) backdropRef.current.style.opacity = '0';
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Scroll lock is handled by the dedicated effect
      }, 300); // Match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // --- Gesture Logic (Edge Swipe Only) ---

  const snapBack = () => {
    if (panelRef.current) {
      panelRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
      panelRef.current.style.transform = 'translateX(0%)';
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = 'opacity 0.3s ease';
      backdropRef.current.style.opacity = '1';
    }
    isDragging.current = false;
    startX.current = null;
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Only Trigger if starting from the left edge (iOS Back Swipe style)
    if (touch.clientX < 40) {
      startX.current = touch.clientX;
      isDragging.current = true;
      if (panelRef.current) {
        // Disable transition for instant follow
        panelRef.current.style.transition = 'none';
      }
    } else {
      startX.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || startX.current === null) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - startX.current;

    // Only allow dragging to the right (positive dx)
    if (dx > 0) {
      if (panelRef.current) {
        panelRef.current.style.transform = `translateX(${dx}px)`;
      }
      if (backdropRef.current) {
        // Fade out backdrop as we swipe
        const opacity = Math.max(0, 1 - dx / window.innerWidth);
        backdropRef.current.style.opacity = opacity.toString();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current || startX.current === null) return;
    
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX.current;
    
    // Threshold to close: Dragged more than 100px
    if (dx > 100) {
      // Restore transition for smooth exit (handled by useEffect when onClose changes prop)
      if (panelRef.current) {
        panelRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
      }
      isDragging.current = false;
      startX.current = null;
      onClose();
    } else {
      snapBack();
    }
  };

  // Fix for "stuck" state:
  // If the browser interrupts the gesture (e.g. for native scrolling), it fires touchcancel.
  // We must reset the position here to avoid the panel being stuck in the middle of a drag.
  const handleTouchCancel = () => {
    if (isDragging.current) {
      snapBack();
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[${zIndex}] flex justify-end`}>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm opacity-0 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Slide Panel */}
      <div
        ref={panelRef}
        className="relative w-full h-full bg-white dark:bg-gray-900 shadow-2xl translate-x-full transition-transform duration-300 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        // Critical: 'pan-y' tells browser to handle vertical scrolling, 
        // leaving horizontal gestures for our JS code.
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </div>
    </div>
  );
};
