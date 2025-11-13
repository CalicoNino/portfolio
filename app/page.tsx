"use client";

import { useEffect, useRef, useState } from "react";
import { themes, type ThemeKey } from "@/lib/themes";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { HeroSection } from "@/components/hero-section";
import { WorkSection } from "@/components/work-section";
import { ProjectsSection } from "@/components/projects-section";
import { ThoughtsSection } from "@/components/thoughts-section";
import { ConnectSection } from "@/components/connect-section";
import { Footer } from "@/components/footer";
import personalData from "@/data/personal.json";
import workData from "@/data/work.json";

const Home = () => {
  const [isDark, setIsDark] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("rust");
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    const theme = themes[activeTheme];
    const root = document.documentElement;

    if (isDark) {
      root.style.setProperty("--primary", theme.colors.primaryDark);
      root.style.setProperty("--accent", theme.colors.accentDark);
    } else {
      root.style.setProperty("--primary", theme.colors.primary);
      root.style.setProperty("--accent", theme.colors.accent);
    }

    root.style.setProperty("--bg-1", theme.colors.bg1);
    root.style.setProperty("--bg-2", theme.colors.bg2);
    root.style.setProperty("--bg-3", theme.colors.bg3);
  }, [activeTheme, isDark]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "0px 0px -20% 0px" }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const switchTheme = (theme: ThemeKey) => {
    setActiveTheme(theme);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      <div
        className="fixed inset-0 opacity-20 pointer-events-none transition-opacity duration-300 z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--bg-1), transparent 40%)`,
        }}
      />

      <ScrollIndicator activeSection={activeSection} />

      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-16 relative z-10 pt-8 sm:pt-0">
        <HeroSection
          personalData={personalData}
          activeTheme={activeTheme}
          switchTheme={switchTheme}
          sectionsRef={sectionsRef}
        />

        <WorkSection
          workData={workData}
          activeTheme={activeTheme}
          sectionsRef={sectionsRef}
        />

        <ProjectsSection activeTheme={activeTheme} sectionsRef={sectionsRef} />

        <ThoughtsSection activeTheme={activeTheme} sectionsRef={sectionsRef} />

        <ConnectSection activeTheme={activeTheme} sectionsRef={sectionsRef} />

        <Footer isDark={isDark} toggleTheme={toggleTheme} />
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background via-background/80 to-transparent pointer-events-none z-20"></div>
    </div>
  );
};

export default Home;
