import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

// Function to immediately sync HTML element class
const syncThemeClass = (isDark: boolean) => {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Default to dark mode for our AI platform
      isDark: true,
      
      toggleTheme: () => {
        const newTheme = !get().isDark;
        syncThemeClass(newTheme);
        set({ isDark: newTheme });
      },
      
      setTheme: (isDark: boolean) => {
        syncThemeClass(isDark);
        set({ isDark });
      }
    }),
    {
      name: 'theme-storage',
      // Run once on hydrate to sync initial state to DOM
      onRehydrateStorage: () => (state) => {
        if (state) syncThemeClass(state.isDark);
      }
    }
  )
)

// Run immediately for initial load if running in browser
if (typeof document !== 'undefined') {
  const storedTheme = localStorage.getItem('theme-storage');
  if (storedTheme) {
    try {
      const { state } = JSON.parse(storedTheme);
      syncThemeClass(state.isDark);
    } catch (e) {
      // Fallback to dark if parsing fails
      syncThemeClass(true);
    }
  } else {
    // Default fallback
    syncThemeClass(true);
  }
}
