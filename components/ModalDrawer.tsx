
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { RemoveScroll } from 'react-remove-scroll';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const ModalDrawer: React.FC<Props> = ({ isOpen, onClose, title, children }) => {
  const controls = useDragControls();
  // Cache content to ensure it persists during the exit animation
  const [displayedContent, setDisplayedContent] = useState({ title, children });

  useEffect(() => {
    if (isOpen) {
      setDisplayedContent({ title, children });
    }
  }, [isOpen, title, children]);

  // Handle Theme Color Sync
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    if (isOpen) {
      if (metaThemeColor) metaThemeColor.setAttribute('content', isDarkMode ? '#0A0F17' : '#999999');
    } else {
      if (metaThemeColor) metaThemeColor.setAttribute('content', isDarkMode ? '#101624' : '#FEFEFE');
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <RemoveScroll>
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragListener={false} // Disable drag on content, enable via controls
              dragControls={controls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(e, info: PanInfo) => {
                if (info.offset.y > 100 || info.velocity.y > 300) {
                  onClose();
                }
              }}
              className="relative pointer-events-auto bg-white dark:bg-gray-900 w-full md:w-[800px] md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh]"
            >
              {/* Handle Bar (Drag Target) */}
              <div 
                className="w-full flex justify-center pt-3 pb-1 cursor-grab touch-none"
                onPointerDown={(e) => controls.start(e)}
              >
                 <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>

              {/* Header */}
              <div 
                className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 shrink-0"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{displayedContent.title}</h2>
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
                {displayedContent.children}
              </div>
            </motion.div>
          </div>
        </RemoveScroll>
      )}
    </AnimatePresence>
  );
};
