
import React, { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const ModalDrawer: React.FC<Props> = ({ isOpen, onClose, title, children }) => {
  const [visible, setVisible] = useState(false);

  // Sync Theme Color with Drawer State
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    if (isOpen) {
      // When drawer is open, dim the status bar to match the backdrop overlay
      // Light Mode: Gray-500 (#6b7280) to simulate dimmed effect
      // Dark Mode: Black (#000000) for deeper immersion
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDarkMode ? '#000000' : '#6b7280');
      }
      
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      // When drawer closes, revert to app background
      // Light Mode: Gray-50 (#f9fafb)
      // Dark Mode: Gray-950 (#0d1117)
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDarkMode ? '#0d1117' : '#f9fafb');
      }

      const timer = setTimeout(() => setVisible(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
    
    return () => { 
      document.body.style.overflow = ''; 
      // Safety revert on unmount
      if (metaThemeColor) {
         metaThemeColor.setAttribute('content', isDarkMode ? '#0d1117' : '#f9fafb');
      }
    };
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-end md:items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer / Modal Content */}
      <div 
        className={`
          relative bg-white dark:bg-gray-900 w-full md:w-[800px] md:rounded-2xl 
          rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh]
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-full md:translate-y-10 md:scale-95'}
        `}
      >
        {/* Mobile Handle Bar */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 dark:border-gray-800">
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
