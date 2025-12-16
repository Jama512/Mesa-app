// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState } from "react";
import { lightTheme, darkTheme, ThemeType } from "./theme";

interface ThemeContextProps {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: lightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentThemeName, setCurrentThemeName] = useState<"light" | "dark">(
    "light"
  );

  const toggleTheme = () => {
    setCurrentThemeName((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = currentThemeName === "light" ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
