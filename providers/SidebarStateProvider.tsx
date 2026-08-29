'use client';

import React, { createContext, useContext, useState } from 'react';

interface SidebarStateContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

const SidebarStateContext = createContext<SidebarStateContextType | undefined>(undefined);

export const SidebarStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <SidebarStateContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
      }}
    >
      {children}
    </SidebarStateContext.Provider>
  );
};

export const useSidebarState = () => {
  const context = useContext(SidebarStateContext);
  if (!context) {
    throw new Error('useSidebarState must be used within a SidebarStateProvider');
  }
  return context;
};
