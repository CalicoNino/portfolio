import type React from "react";

import projectsData from "@/data/projects.json";
import { themes, type ThemeKey } from "@/lib/themes";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";

interface ProjectsSectionProps {
  activeTheme: ThemeKey;
  sectionsRef: React.MutableRefObject<(HTMLElement | null)[]>;
}

export const ProjectsSection = ({
  activeTheme,
  sectionsRef,
}: ProjectsSectionProps) => {
  return (
    <section
      id="projects"
      ref={(el) => {
        sectionsRef.current[2] = el;
      }}
      className="py-16 sm:py-20 lg:py-32 opacity-0"
    >
      <div className="space-y-6 sm:space-y-12 lg:space-y-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h2 className="text-3xl sm:text-4xl font-light">
            <span className="text-primary font-mono text-2xl">
              {themes[activeTheme].syntax}{" "}
            </span>
            featured_projects
            <span className="text-primary font-mono">
              {activeTheme === "rust" && " { /* Vec<Project> */ }"}
              {activeTheme === "go" && " { /* []Project */ }"}
              {activeTheme === "java" && " { /* Project[] */ }"}
              {activeTheme === "typescript" && " { /* Project[] */ }"}
              {activeTheme === "python" && ": /* list[Project] */"}
              {activeTheme === "sql" && " ( /* Project */ )"}
            </span>
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {projectsData.map((project, index) => (
            <a
              key={index}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden p-6 border border-border rounded-lg bg-card/30 backdrop-blur-sm hover:border-primary hover:bg-card/60 hover:shadow-[0_8px_30px_oklch(0.68_0.25_35/0.15)] hover:-translate-y-1 transition-all duration-500 cursor-pointer"
            >
              <div
                className={`absolute inset-0 bg-linear-to-br ${project.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="space-y-4 relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg sm:text-xl font-medium group-hover:text-primary transition-colors duration-300">
                    {project.title}
                  </h3>
                  <span className="px-2 py-1 text-xs font-mono text-primary border border-primary/30 rounded shrink-0 bg-background/50 group-hover:border-primary group-hover:bg-primary/10 group-hover:shadow-[0_0_10px_var(--primary)/0.3] transition-all duration-300">
                    {project.status}
                  </span>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 items-start content-start">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 text-xs font-mono text-muted-foreground border border-border rounded bg-background/50 group-hover:border-primary/50 group-hover:text-primary group-hover:bg-primary/5 transition-all duration-500"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm font-mono text-primary">
                  <span>
                    {themes[activeTheme].funcPrefix}view
                    {themes[activeTheme].funcSuffix}
                    {themes[activeTheme].arrow}
                  </span>
                  <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="text-primary font-mono text-2xl">
          {activeTheme === "rust" && "/* end impl */"}
          {activeTheme === "go" && "/* end */"}
          {activeTheme === "java" && "/* end class */"}
          {activeTheme === "typescript" && "/* end */"}
          {activeTheme === "python" && "# end"}
          {activeTheme === "sql" && "-- end"}
        </div>
      </div>
    </section>
  );
};
