
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
      // Mount the component first
      setVisible(true);
      document.body.style.overflow = 'hidden';

      // Set animate to true in the next tick to trigger CSS transition
      // We use a small timeout to ensure the browser paints the initial "closed" state first
      const timer = setTimeout(() => {
        setAnimate(true);
        if (metaThemeColor) {
           metaThemeColor.setAttribute('content', isDarkMode ? '#0A0F17' : '#999999');
        }
      }, 20); // 20ms delay is usually sufficient
      
      return () => clearTimeout(timer);
    } else {
      // Trigger exit animation
      setAnimate(false);

      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDarkMode ? '#101624' : '#FEFEFE');
      }

      // Unmount after animation finishes
      const timer = setTimeout(() => {
        setVisible(false);
        document.body.style.overflow = '';
      }, 300); // Match CSS duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>

      {/* Drawer / Modal Content */}
      <div 
        className={`
          relative bg-white dark:bg-gray-900 w-full md:w-[800px] md:rounded-2xl 
          rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh]
          transform transition-all duration-300 cubic-bezier(0.32, 0.72, 0, 1)
          ${animate ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 md:translate-y-10 md:scale-95'}
        `}
      >
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
