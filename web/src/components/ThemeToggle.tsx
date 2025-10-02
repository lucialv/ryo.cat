import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-purple-200/40 dark:bg-purple-700/50 text-purple-900 dark:text-purple-200 hover:bg-purple-300/50 dark:hover:bg-purple-600 transition-colors backdrop-blur-md"
      aria-label={
        theme === "light" ? "Activar modo oscuro" : "Activar modo claro"
      }
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
