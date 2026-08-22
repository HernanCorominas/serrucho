"use client";

import * as React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { hapticLight } from "@/lib/utils/haptics";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-8 rounded-lg bg-muted/40 animate-pulse" />;
  }

  const cycleTheme = () => {
    hapticLight();
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
      title={`Tema actual: ${theme} (haz clic para cambiar)`}
    >
      {theme === "system" ? (
        <Laptop className="h-4 w-4 text-primary" />
      ) : resolvedTheme === "dark" ? (
        <Moon className="h-4 w-4 text-amber-400" />
      ) : (
        <Sun className="h-4 w-4 text-amber-500" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
