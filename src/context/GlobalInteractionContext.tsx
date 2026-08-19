import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalInteractionContextType {
  isBlocking: boolean;
  setBlocking: (blocking: boolean) => void;
}

const GlobalInteractionContext = createContext<GlobalInteractionContextType | undefined>(undefined);

export function GlobalInteractionProvider({ children }: { children: ReactNode }) {
  const [isBlocking, setIsBlocking] = useState(false);

  return (
    <GlobalInteractionContext.Provider value={{ isBlocking, setBlocking: setIsBlocking }}>
      {children}
      {isBlocking && (
        <div className="fixed inset-0 z-[9999] bg-black/10 cursor-wait" onClick={(e) => e.stopPropagation()}>
          {/* Optional: Add a global spinner here if desired, but user just asked to block interactions */}
        </div>
      )}
    </GlobalInteractionContext.Provider>
  );
}

export function useGlobalInteraction() {
  const context = useContext(GlobalInteractionContext);
  if (context === undefined) {
    throw new Error('useGlobalInteraction must be used within a GlobalInteractionProvider');
  }
  return context;
}
