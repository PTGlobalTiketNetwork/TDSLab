import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NavigationBlockerContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  pendingNavigation: (() => void) | null;
  setPendingNavigation: (callback: (() => void) | null) => void;
  blockNavigation: (targetPath: () => void) => boolean;
}

const NavigationBlockerContext = createContext<NavigationBlockerContextType | undefined>(undefined);

export function NavigationBlockerProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const blockNavigation = useCallback((targetPath: () => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => targetPath);
      return true; // Navigation is blocked
    }
    return false; // Navigation is not blocked
  }, [hasUnsavedChanges]);

  return (
    <NavigationBlockerContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        pendingNavigation,
        setPendingNavigation,
        blockNavigation,
      }}
    >
      {children}
    </NavigationBlockerContext.Provider>
  );
}

export function useNavigationBlocker() {
  const context = useContext(NavigationBlockerContext);
  if (!context) {
    throw new Error('useNavigationBlocker must be used within NavigationBlockerProvider');
  }
  return context;
}
