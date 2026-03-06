import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState('en');

  return (
    <AppContext.Provider value={{ dark, setDark, lang, setLang }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
