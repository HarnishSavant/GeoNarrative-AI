import { create } from 'zustand';
import { DashboardMode, SidebarTab } from '@/lib/types';

interface UIState {
  activeTab: SidebarTab;
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  dashboardMode: DashboardMode;
  hasSearched: boolean;
  
  setActiveTab: (tab: SidebarTab) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setDashboardMode: (mode: DashboardMode) => void;
  setHasSearched: (searched: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'map',
  sidebarCollapsed: false,
  rightPanelOpen: true,
  dashboardMode: 'terrain',
  hasSearched: true,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setDashboardMode: (mode) => set({ dashboardMode: mode }),
  setHasSearched: (searched) => set({ hasSearched: searched }),
}));
