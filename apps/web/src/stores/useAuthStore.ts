import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type TerminalRole = 'MAITRI' | 'BHARATI' | 'HQ';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  terminal: TerminalRole;
  stationId?: string | null;
}

export const PRESET_ACCOUNTS: Record<TerminalRole, AuthUser> = {
  MAITRI: {
    id: '00000001-0000-0000-0000-000000000002',
    email: 'commander.maitri@antarctic.gov.in',
    name: 'Col. Amitav Banerjee',
    role: 'STATION_COMMANDER',
    terminal: 'MAITRI',
    stationId: 'MAITRI',
  },
  BHARATI: {
    id: '00000001-0000-0000-0000-000000000003',
    email: 'commander.bharati@antarctic.gov.in',
    name: 'Cmdr. Sunita Rao',
    role: 'STATION_COMMANDER',
    terminal: 'BHARATI',
    stationId: 'BHARATI',
  },
  HQ: {
    id: '00000001-0000-0000-0000-000000000001',
    email: 'admin@antarctic.gov.in',
    name: 'Dr. Rajeshwar Sharma',
    role: 'MISSION_DIRECTOR',
    terminal: 'HQ',
    stationId: null,
  },
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  activeTerminal: TerminalRole;
  loginAs: (terminal: TerminalRole) => void;
  setUserSession: (user: AuthUser, token?: string) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Check localStorage if in browser
  let initialUser: AuthUser | null = null;
  let initialTerminal: TerminalRole = 'HQ';

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('antarctic_auth_session');
      if (stored) {
        initialUser = JSON.parse(stored);
        if (initialUser?.terminal) initialTerminal = initialUser.terminal;
      }
    } catch {}
  }

  // Default to HQ preset if none stored so demo never blocks
  if (!initialUser) {
    initialUser = PRESET_ACCOUNTS.HQ;
  }

  return {
    user: initialUser,
    token: null,
    isAuthenticated: !!initialUser,
    activeTerminal: initialTerminal,

    loginAs: (terminal: TerminalRole) => {
      const account = PRESET_ACCOUNTS[terminal];
      if (typeof window !== 'undefined') {
        localStorage.setItem('antarctic_auth_session', JSON.stringify(account));
      }
      set({
        user: account,
        isAuthenticated: true,
        activeTerminal: terminal,
      });
    },

    setUserSession: (user: AuthUser, token?: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('antarctic_auth_session', JSON.stringify(user));
      }
      set({
        user,
        token: token || null,
        isAuthenticated: true,
        activeTerminal: user.terminal,
      });
    },

    logout: async () => {
      try {
        await supabase.auth.signOut();
      } catch {}
      if (typeof window !== 'undefined') {
        localStorage.removeItem('antarctic_auth_session');
      }
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    },
  };
});
