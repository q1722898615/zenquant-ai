
import React, { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const ModalDrawer: React.FC<Props> = ({ isOpen, onClose, title, children }) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  // Sync Theme Color with Drawer State
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    if (isOpen) {
      // 1. Mount the component first
      setVisible(true);
      document.body.style.overflow = 'hidden';

      // 2. Use double requestAnimationFrame to ensure the browser paints the initial state
      // (translate-y-full) before applying the transition to active state (translate-y-0).
      // This is much smoother and more reliable than setTimeout for initial mounting animations.
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
          if (metaThemeColor) {
             metaThemeColor.setAttribute('content', isDarkMode ? '#0A0F17' : '#999999');
          }
        });
      });
      
      return () => cancelAnimationFrame(raf);
    } else {
      // 1. Trigger exit animation
      setAnimate(false);

      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDarkMode ? '#101624' : '#FEFEFE');
      }

      // 2. Unmount after animation finishes (500ms to match CSS duration)
      const timer = setTimeout(() => {
        setVisible(false);
        document.body.style.overflow = '';
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto
          transition-opacity duration-500 ease-out
          ${animate ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
      ></div>

      {/* Drawer / Modal Content */}
      <div 
        className={`
          relative pointer-events-auto
          bg-white dark:bg-gray-900 w-full md:w-[800px] md:rounded-2xl 
          rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh]
          transform transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) will-change-transform
          ${animate 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-full opacity-100 md:opacity-0 md:translate-y-10 md:scale-95'
          }
        `}
      >
        {/* Note on classes above: 
            On mobile (default), we want 'translate-y-full' with 'opacity-100' for exit state.
            This ensures the drawer looks like a solid object sliding down, rather than fading out while sliding.
            On desktop (md), we use 'opacity-0' with a small slide for a modal fade effect.
        */}

        {/* Mobile Handle Bar */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
