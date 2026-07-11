
import type React from "react";

import type workDataJson from "@/data/work.json";
import { themes, type ThemeKey } from "@/lib/themes";

interface WorkSectionProps {
  workData: typeof workDataJson;
  activeTheme: ThemeKey;
  sectionsRef: React.RefObject<(HTMLElement | null)[]>;
}

export function WorkSection({
  workData,
  activeTheme,
  sectionsRef,
}: WorkSectionProps) {
  const theme = themes[activeTheme];

  return (
    <section
      id="work"
      ref={(el) => {
        sectionsRef.current[1] = el;
      }}
      className="py-16 sm:py-20 lg:py-32 opacity-0"
    >
      <div className="space-y-6 sm:space-y-12 lg:space-y-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h2 className="text-3xl sm:text-4xl font-light">
            <span className="text-primary font-mono text-2xl">
              {theme.syntax}{" "}
            </span>
            selected_work
            <span className="text-primary font-mono">
              {theme.listAnnotation("Work")}
            </span>
          </h2>
        </div>

        <div className="space-y-6">
          {workData.map((job) => (
            <div
              key={`${job.company}-${job.year}`}
              className="group grid lg:grid-cols-12 gap-4 sm:gap-8 p-4 sm:p-6 border border-border rounded-lg bg-card/30 backdrop-blur-sm hover:border-primary hover:bg-card/60 hover:shadow-[0_8px_30px_oklch(0.68_0.25_35/0.15)] hover:-translate-y-1 transition-all duration-500"
            >
              <div className="lg:col-span-2 flex flex-col gap-2">
                <div className="text-xl sm:text-2xl font-mono text-primary group-hover:text-accent transition-colors duration-500">
                  {job.year}
                </div>
                <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/30 w-fit">
                  {job.stats}
                </div>
              </div>

              <div className="lg:col-span-6 space-y-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-medium group-hover:text-primary transition-colors duration-300">
                    {job.role}
                  </h3>
                  <div className="text-muted-foreground font-mono text-sm">
                    {job.company}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-wrap gap-2 lg:justify-end items-start content-start">
                {job.tech.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 text-xs font-mono text-muted-foreground border border-border rounded group-hover:border-primary/50 group-hover:text-primary group-hover:bg-primary/5 transition-all duration-500"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-primary font-mono text-2xl">
          {theme.endComment}
        </div>
      </div>
    </section>
  );
}
