// Contexte de thème — dark / light
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  // Récupère le thème sauvegardé ou dark par défaut
  const [theme, setTheme] = useState(() => localStorage.getItem('hirrde-theme') ?? 'dark');

  useEffect(() => {
    // Applique l'attribut data-theme sur le document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hirrde-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
