
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { RemoveScroll } from 'react-remove-scroll';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: number;
}

export const SlideOver: React.FC<SlideOverProps> = ({ isOpen, onClose, children, zIndex = 50 }) => {
  // Cache children to ensure content persists during exit animation
  const [displayedChildren, setDisplayedChildren] = useState(children);

  useEffect(() => {
    if (isOpen) {
      setDisplayedChildren(children);
    }
  }, [isOpen, children]);

  return (
    <AnimatePresence>
      {isOpen && (
        <RemoveScroll>
          <div className={`fixed inset-0 z-[${zIndex}] flex justify-end`}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Slide Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.5 }}
              onDragEnd={(e, info: PanInfo) => {
                // Trigger close if dragged > 100px OR flicked fast to the right
                if (info.offset.x > 100 || info.velocity.x > 300) {
                  onClose();
                }
              }}
              className="relative w-full h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
            >
              {displayedChildren}
            </motion.div>
          </div>
        </RemoveScroll>
      )}
    </AnimatePresence>
  );
};
