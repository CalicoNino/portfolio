import type React from "react";

import { useState } from "react";

interface ScrollIndicatorProps {
  activeSection: string;
}

const SECTIONS = [
  { id: "intro", label: "Intro" },
  { id: "work", label: "Work" },
  { id: "projects", label: "Projects" },
  { id: "thoughts", label: "Thoughts" },
  { id: "connect", label: "Connect" },
];

export function ScrollIndicator({ activeSection }: ScrollIndicatorProps) {
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);

  return (
    <nav className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden xl:block">
      <div className="flex flex-col gap-6">
        {SECTIONS.map((section, index) => (
          <button
            key={section.id}
            onClick={() => {
              document
                .getElementById(section.id)
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            onMouseEnter={() => setHoveredSection(index)}
            onMouseLeave={() => setHoveredSection(null)}
            className="cursor-pointer relative group"
            aria-label={`Go to ${section.id}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              className="transition-all duration-300"
              style={{
                filter:
                  activeSection === section.id
                    ? "drop-shadow(0 0 6px var(--primary))"
                    : "none",
              }}
            >
              <path
                d="M10 1 L16.9 4.4 L18.5 11.7 L14 17.8 L6 17.8 L1.5 11.7 L3.1 4.4 Z"
                className={`transition-all duration-500 ${
                  activeSection === section.id
                    ? "stroke-primary stroke-2"
                    : "stroke-border stroke-[1.5] group-hover:stroke-primary"
                }`}
                fill="none"
                strokeLinejoin="round"
              />
              <path
                d="M10 1 L16.9 4.4 L18.5 11.7 L14 17.8 L6 17.8 L1.5 11.7 L3.1 4.4 Z"
                className={`transition-all duration-500 ${
                  activeSection === section.id
                    ? "fill-primary opacity-100"
                    : "fill-primary opacity-0 group-hover:opacity-20"
                }`}
                strokeLinejoin="round"
              />
              {activeSection === section.id && (
                <path
                  d="M10 4 L14.5 6.2 L15.5 10.5 L12.5 14 L7.5 14 L4.5 10.5 L5.5 6.2 Z"
                  className="fill-background/50 animate-pulse"
                />
              )}
            </svg>

            <span
              className={`absolute left-8 top-1/2 -translate-y-1/2 text-xs font-mono text-primary whitespace-nowrap transition-all duration-300 ${
                hoveredSection === index
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-2"
              }`}
            >
              {section.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
