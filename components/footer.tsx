
import { Link } from "react-router";
import personalData from "@/data/personal.json";

interface FooterProps {
  onSailClick?: () => void;
}

export const Footer = ({ onSailClick }: FooterProps) => (
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
      </div>
    </div>
  </footer>
);
