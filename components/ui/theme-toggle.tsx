import { useEffect, useState } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";
import { Button } from "./button";
import { getTheme, setTheme, watchSystemTheme } from "@/lib/theme";
import { t } from "@/lib/i18n";

export function ThemeToggle() {
  const [theme, setCurrentTheme] = useState<"light" | "dark" | "system">(
    "system"
  );

  useEffect(() => {
    // 初始化主题
    getTheme().then(setCurrentTheme);
    // 监听系统主题变化
    watchSystemTheme();
  }, []);

  const cycleTheme = async () => {
    const themeOrder: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    await setTheme(nextTheme);
    setCurrentTheme(nextTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      title={
        theme === "light"
          ? t("theme.light")
          : theme === "dark"
          ? t("theme.dark")
          : t("theme.system")
      }
    >
      <Sun
        className={`h-[1.2rem] w-[1.2rem] transition-all ${
          theme === "light" ? "rotate-90 scale-100" : "scale-0"
        }`}
      />
      <Moon
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
          theme === "dark" ? "rotate-0 scale-100" : "scale-0"
        }`}
      />
      <SunMoon
        className={`absolute h-[1.2rem] w-[1.2rem] rotate-0 transition-all ${
          theme === "system" ? "scale-100" : "scale-0"
        }`}
      />
      <span className="sr-only">
        {theme === "light"
          ? t("theme.light")
          : theme === "dark"
          ? t("theme.dark")
          : t("theme.system")}
      </span>
    </Button>
  );
}
