
import type React from "react";
import type personalDataJson from "@/data/personal.json";
import { themes, type ThemeKey } from "@/lib/themes";
import { GitHubIcon } from "@/components/icons/github-icon";
import { TwitterIcon } from "@/components/icons/twitter-icon";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { DiscordIcon } from "@/components/icons/discord-icon";

type PersonalData = typeof personalDataJson;

interface HeroSectionProps {
  personalData: PersonalData;
  activeTheme: ThemeKey;
  switchTheme: (theme: ThemeKey) => void;
  sectionsRef: React.RefObject<(HTMLElement | null)[]>;
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
      className="sm:min-h-screen flex items-center opacity-0 relative py-16 sm:py-0"
    >
      <div className="grid lg:grid-cols-5 gap-12 sm:gap-16 w-full relative">
        <div className="lg:col-span-3 space-y-6 sm:space-y-8 bg-background/30 backdrop-blur-md rounded-2xl p-5 sm:p-7">
          <div className="space-y-4">
            <div className="text-xs font-mono text-primary tracking-wider animate-fade-in-stagger-1">
              <span className="text-muted-foreground">{theme.comment} </span>
              SOFTWARE ENGINEER
            </div>
            <div className="space-y-4 animate-fade-in-stagger-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight flex flex-row flex-wrap items-baseline gap-x-1.5 gap-y-0">
                <span className="text-primary font-mono text-xs opacity-60 whitespace-nowrap">
                  {theme.title}
                </span>
                <span className="whitespace-nowrap">
                  {personalData.name.split(" ")[0]}{" "}
                  <span className="text-muted-foreground">
                    {personalData.name.split(" ")[1]}
                  </span>
                </span>
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
              {personalData.bio.prefix}
              <span className="text-primary font-mono">
                {" "}
                {theme.resultSyntax}
              </span>
              <span className="text-accent">{personalData.bio.highlight}</span>
              <span className="text-primary font-mono">
                {theme.resultClosing}
              </span>
              {personalData.bio.suffix}
            </p>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2 font-mono">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_8px_oklch(0.65_0.28_15/0.6)]"></div>
                <span className="text-muted-foreground">
                  {theme.watchingLabel}
                </span>
                <span className="text-accent">
                  {theme.quote}
                  {personalData.funFacts.currently_watching}
                  {theme.quote}
                </span>
              </div>
            </div>
          </div>

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
