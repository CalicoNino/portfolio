import type React from "react";

import personalData from "@/data/personal.json";
import { themes, type ThemeKey } from "@/lib/themes";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";

interface ConnectSectionProps {
  activeTheme: ThemeKey;
  sectionsRef: React.RefObject<(HTMLElement | null)[]>;
}

export const ConnectSection = ({
  activeTheme,
  sectionsRef,
}: ConnectSectionProps) => (
  <section
    id="connect"
    ref={(el) => {
      sectionsRef.current[4] = el;
    }}
    className="py-16 sm:py-20 lg:py-32 opacity-0"
  >
    <div className="grid lg:grid-cols-2 gap-12 sm:gap-16">
      <div className="space-y-6 sm:space-y-8">
        <h2 className="text-3xl sm:text-4xl font-light">
          <span className="text-primary font-mono text-2xl">
            {activeTheme === "rust" && "impl "}
            {activeTheme === "go" && "func "}
            {activeTheme === "java" && "public class "}
            {activeTheme === "typescript" && "const "}
            {activeTheme === "python" && "def "}
            {activeTheme === "sql" && "SELECT "}
          </span>
          Connect
          <span className="text-primary font-mono">
            {activeTheme === "rust" && " {}"}
            {activeTheme === "go" && "() {}"}
            {activeTheme === "java" && " {}"}
            {activeTheme === "typescript" && " = () => {}"}
            {activeTheme === "python" && "():"}
            {activeTheme === "sql" && " *"}
          </span>
        </h2>

        <div className="space-y-6">
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Always interested in new opportunities, collaborations, and
            conversations about
            <span className="text-primary font-mono"> code </span>
            and
            <span className="text-accent font-mono"> design</span>.
          </p>

          <div className="space-y-4">
            <a
              href={`mailto:${personalData.email}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 font-mono text-primary hover:text-accent transition-colors duration-300 cursor-pointer"
            >
              <span className="text-base sm:text-lg">{personalData.email}</span>
              <ArrowRightIcon className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
            </a>
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-8">
        <div className="text-xs text-primary font-mono">
          {themes[activeTheme].comment}* ELSEWHERE *
          {themes[activeTheme].comment}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              name: "GitHub",
              handle: "@CalicoNino",
              url: personalData.social.github,
            },
            // {
            //   name: "LinkedIn",
            //   handle: "caliconino",
            //   url: personalData.social.linkedin,
            // },
            {
              name: "Twitter",
              handle: "@caliconino",
              url: personalData.social.twitter,
            },
          ].map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 border border-border rounded-lg bg-card/30 backdrop-blur-sm hover:border-primary hover:bg-card/60 hover:shadow-[0_8px_30px_oklch(0.68_0.25_35/0.15)] hover:-translate-y-1 transition-all duration-500 cursor-pointer"
            >
              <div className="space-y-2">
                <div className="text-foreground font-medium group-hover:text-primary transition-colors duration-300">
                  {social.name}
                </div>
                <div className="text-sm font-mono text-muted-foreground">
                  {social.handle}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  </section>
);
