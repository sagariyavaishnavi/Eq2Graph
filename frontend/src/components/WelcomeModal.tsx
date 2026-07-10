import React, { useState, useEffect } from 'react';

export const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-8 max-w-md w-[90%] md:w-full">
        <h2 className="text-2xl font-bold mb-6 text-[var(--color-text)]">Welcome to Eq2Graph</h2>
        
        <ul className="space-y-4 mb-8 text-[var(--color-text)] opacity-90">
          <li className="flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0"></span>
            <span>Draw a math problem or equation on the canvas.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0"></span>
            <span>Click Process to extract the equation and plot the graph.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0"></span>
            <span>Switch to the Type tab to enter equations manually.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0"></span>
            <span>Use the Eraser or Clear tools to fix canvas drawings.</span>
          </li>
        </ul>

        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
