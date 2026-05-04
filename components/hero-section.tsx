
import type React from "react";
import { themes, type ThemeKey } from "@/lib/themes";
import { GitHubIcon } from "@/components/icons/github-icon";
import { TwitterIcon } from "@/components/icons/twitter-icon";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { DiscordIcon } from "@/components/icons/discord-icon";
import { DownloadIcon } from "@/components/icons/download-icon";

interface HeroSectionProps {
  personalData: any;
  activeTheme: ThemeKey;
  switchTheme: (theme: ThemeKey) => void;
  sectionsRef: React.MutableRefObject<(HTMLElement | null)[]>;
}

export function HeroSection({
  personalData,
  activeTheme,
  switchTheme,
  sectionsRef,
}: HeroSectionProps) {
  const theme = themes[activeTheme];

  const socialIcons = [
    { name: "GitHub", url: personalData.social.github, icon: GitHubIcon },
    { name: "Twitter", url: personalData.social.twitter, icon: TwitterIcon },
    { name: "Telegram", url: personalData.social.telegram, icon: TelegramIcon },
    { name: "Discord", url: personalData.social.discord, icon: DiscordIcon },
  ];

  return (
    <header
      id="intro"
      ref={(el) => {
        sectionsRef.current[0] = el;
      }}
      className="min-h-screen flex items-center opacity-0 relative"
    >
      <div className="grid lg:grid-cols-5 gap-12 sm:gap-16 w-full relative">
        <div className="lg:col-span-3 space-y-6 sm:space-y-8 bg-background/30 backdrop-blur-md rounded-2xl p-5 sm:p-7">
          <div className="space-y-4">
            <div className="text-xs font-mono text-primary tracking-wider animate-fade-in-stagger-1">
              <span className="text-muted-foreground">{theme.comment} </span>
              FULLSTACK DEVELOPER
            </div>
            <div className="space-y-4 animate-fade-in-stagger-2">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight flex flex-row items-baseline gap-2">
                <span className="text-primary font-mono text-xs opacity-60 whitespace-nowrap">
                  {theme.title}
                </span>
                <p className="whitespace-nowrap">
                  {personalData.name.split(" ")[0]}{" "}
                  <span className="text-muted-foreground">
                    {personalData.name.split(" ")[1]}
                  </span>
                </p>
                <span className="text-primary font-mono text-xs opacity-60 whitespace-nowrap">
                  {theme.closing}
                </span>
              </h1>

              <div className="flex items-center gap-3">
                {socialIcons.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_15px_oklch(0.68_0.25_35/0.3)] transition-all duration-300 group cursor-pointer"
                      aria-label={social.name}
                    >
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bio and Status */}
          <div className="space-y-6 max-w-md animate-fade-in-stagger-3">
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              {personalData.bio.split("Result<")[0]}
              <span className="text-primary font-mono">
                {" "}
                {theme.resultSyntax}
              </span>
              <span className="text-accent">features, code</span>
              <span className="text-primary font-mono">
                {theme.resultClosing}
              </span>
              {personalData.bio.split(">")[1]}
            </p>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2 font-mono">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_8px_oklch(0.65_0.28_15/0.6)]"></div>
                {activeTheme === "rust" && (
                  <>
                    <span className="text-muted-foreground">
                      currently_watching:
                    </span>
                    <span className="text-accent">
                      &quot;{personalData.funFacts.currently_watching}&quot;
                    </span>
                  </>
                )}
                {activeTheme === "go" && (
                  <>
                    <span className="text-muted-foreground">
                      CurrentlyWatching:{" "}
                    </span>
                    <span className="text-accent">
                      &quot;{personalData.funFacts.currently_watching}&quot;
                    </span>
                  </>
                )}
                {activeTheme === "java" && (
                  <>
                    <span className="text-muted-foreground">
                      getCurrentlyWatching() ={" "}
                    </span>
                    <span className="text-accent">
                      &quot;{personalData.funFacts.currently_watching}&quot;
                    </span>
                  </>
                )}
                {activeTheme === "typescript" && (
                  <>
                    <span className="text-muted-foreground">
                      currentlyWatching:{" "}
                    </span>
                    <span className="text-accent">
                      &quot;{personalData.funFacts.currently_watching}&quot;
                    </span>
                  </>
                )}
                {activeTheme === "python" && (
                  <>
                    <span className="text-muted-foreground">
                      currently_watching ={" "}
                    </span>
                    <span className="text-accent">
                      &quot;{personalData.funFacts.currently_watching}&quot;
                    </span>
                  </>
                )}
                {activeTheme === "sql" && (
                  <>
                    <span className="text-muted-foreground">
                      currently_watching ={" "}
                    </span>
                    <span className="text-accent">
                      &apos;{personalData.funFacts.currently_watching}&apos;
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:scale-105 transition-all duration-300 font-mono text-xs animate-pulse-glow cursor-pointer"
          >
            <DownloadIcon />
            {theme.resumeFunc}
          </a>
        </div>

        {/* Right Column - Current Role & Stack */}
        <div className="lg:col-span-2 flex flex-col justify-end space-y-6 sm:space-y-8 mt-8 lg:mt-0 animate-fade-in-stagger-4">
          <div className="space-y-4 p-4 border border-border rounded-lg bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-[0_8px_30px_oklch(0.68_0.25_35/0.15)] transition-all duration-500">
            <div className="text-xs text-primary font-mono">
              {theme.comment}* CURRENTLY *{theme.comment}
            </div>
            <div className="space-y-2">
              <div className="text-foreground font-medium">
                {personalData.currentRole.title}
              </div>
              <div className="text-muted-foreground font-mono text-sm">
                @ {personalData.currentRole.company}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {personalData.currentRole.startYear} → Present
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 border border-border rounded-lg bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-500">
            <div className="text-xs text-primary font-mono">
              {theme.comment}* STACK *{theme.comment}
            </div>
            <div className="flex flex-wrap gap-2">
              {personalData.stack.map((skill: string) => (
                <button
                  key={skill}
                  onClick={() => switchTheme(skill.toLowerCase() as ThemeKey)}
                  className={`px-3 py-1.5 text-xs font-mono border rounded transition-all duration-300 cursor-pointer ${
                    activeTheme === skill.toLowerCase()
                      ? "border-primary bg-primary/20 text-primary shadow-[0_4px_12px_var(--primary)/0.3] scale-105"
                      : "border-border hover:border-primary hover:bg-primary/10 hover:-translate-y-1 hover:shadow-[0_4px_12px_var(--primary)/0.2] text-muted-foreground hover:text-primary"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
