
import { Link } from "react-router";
import personalData from "@/data/personal.json";
import { SunIcon } from "@/components/icons/sun-icon";
import { MoonIcon } from "@/components/icons/moon-icon";

interface FooterProps {
  isDark: boolean;
  toggleTheme: () => void;
  onSailClick?: () => void;
}

export const Footer = ({ isDark, toggleTheme, onSailClick }: FooterProps) => (
  <footer className="py-6 sm:py-8 border-t border-border">
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div className="space-y-1">
        <div className="text-sm font-mono text-muted-foreground">
          <span className="text-primary">{"© "}</span>
          {personalData.name}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {onSailClick ? (
          <button
            onClick={onSailClick}
            className="group flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
            title="Set sail"
          >
            <span className="text-base leading-none">⛵</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">Set Sail</span>
          </button>
        ) : (
          <Link
            to="/travel"
            className="group flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors duration-200"
            title="Interactive sailing experience"
          >
            <span className="text-base leading-none">⛵</span>
            <span className="hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity duration-200">/travel</span>
          </Link>
        )}
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
