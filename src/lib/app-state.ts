import { create } from 'zustand';

export type AppScreen =
  | 'landing'
  | 'login'
  | 'onboarding'
  | 'dashboard'
  | 'inbox'
  | 'shipment'
  | 'review'
  | 'nerve-center';

export type UserRole = 'ceo' | 'operations' | 'finance';

export interface AppState {
  // Navigation
  currentScreen: AppScreen;
  setCurrentScreen: (screen: AppScreen) => void;

  // Auth
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Workspace
  workspaceName: string;
  setWorkspaceName: (name: string) => void;
  workspaceIndustry: string;
  setWorkspaceIndustry: (industry: string) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (val: boolean) => void;

  // Connections
  whatsappConnected: boolean;
  setWhatsappConnected: (val: boolean) => void;
  emailConnected: boolean;
  setEmailConnected: (val: boolean) => void;

  // Selected shipment for detail view
  selectedShipmentId: string | null;
  setSelectedShipmentId: (id: string | null) => void;

  // Processing state
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  processingStep: number;
  setProcessingStep: (step: number) => void;

  // Dark mode toggle
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useAppState = create<AppState>((set) => ({
  currentScreen: 'landing',
  setCurrentScreen: (screen) => set({ currentScreen: screen }),

  isAuthenticated: false,
  setIsAuthenticated: (val) => set({ isAuthenticated: val }),
  userName: 'Thabiso M.',
  setUserName: (name) => set({ userName: name }),
  userEmail: 'thabiso@aep-energy.com',
  setUserEmail: (email) => set({ userEmail: email }),
  userRole: 'operations',
  setUserRole: (role) => set({ userRole: role }),

  workspaceName: 'AEP Energy - Logistics Division',
  setWorkspaceName: (name) => set({ workspaceName: name }),
  workspaceIndustry: 'logistics',
  setWorkspaceIndustry: (industry) => set({ workspaceIndustry: industry }),
  onboardingStep: 0,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  onboardingComplete: false,
  setOnboardingComplete: (val) => set({ onboardingComplete: val }),

  whatsappConnected: false,
  setWhatsappConnected: (val) => set({ whatsappConnected: val }),
  emailConnected: false,
  setEmailConnected: (val) => set({ emailConnected: val }),

  selectedShipmentId: null,
  setSelectedShipmentId: (id) => set({ selectedShipmentId: id }),

  isProcessing: false,
  setIsProcessing: (val) => set({ isProcessing: val }),
  processingStep: -1,
  setProcessingStep: (step) => set({ processingStep: step }),

  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));
