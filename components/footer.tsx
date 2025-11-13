"use client";

import personalData from "@/data/personal.json";
import { SunIcon } from "@/components/icons/sun-icon";
import { MoonIcon } from "@/components/icons/moon-icon";

interface FooterProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const Footer = ({ isDark, toggleTheme }: FooterProps) => (
  <footer className="py-6 sm:py-8 border-t border-border">
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div className="space-y-1">
        <div className="text-sm font-mono text-muted-foreground">
          <span className="text-primary">{"© "}</span>
          {personalData.name}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="group p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_15px_oklch(0.68_0.25_35/0.3)] transition-all duration-300 cursor-pointer"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <SunIcon className="text-muted-foreground group-hover:text-primary group-hover:rotate-180 transition-all duration-500" />
          ) : (
            <MoonIcon className="text-muted-foreground group-hover:text-primary group-hover:-rotate-180 transition-all duration-500" />
          )}
        </button>
      </div>
    </div>
  </footer>
);
