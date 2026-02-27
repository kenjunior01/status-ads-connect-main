import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("statusads_theme") || "whatsapp";
  });

  useEffect(() => {
    const el = document.getElementById("app-wrapper");
    if (!el) return;
    el.classList.remove("theme-whatsapp", "theme-meituan");
    el.classList.add(theme === "whatsapp" ? "theme-whatsapp" : "theme-meituan");
    localStorage.setItem("statusads_theme", theme);
  }, [theme]);

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => setTheme((prev) => (prev === "whatsapp" ? "meituan" : "whatsapp"))}
    >
      {theme === "whatsapp" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {theme === "whatsapp" ? "WhatsApp" : "Meituan"}
    </Button>
  );
}
