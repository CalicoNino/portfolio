import { useEffect, useRef, useState } from "react";
import { themes, type ThemeKey } from "@/lib/themes";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { HeroSection } from "@/components/hero-section";
import { WorkSection } from "@/components/work-section";
import { ProjectsSection } from "@/components/projects-section";
import { ThoughtsSection } from "@/components/thoughts-section";
import { ConnectSection } from "@/components/connect-section";
import { Footer } from "@/components/footer";
import { PirateSailingGame } from "@/components/pirate-sailing-game";
import personalData from "@/data/personal.json";
import workData from "@/data/work.json";

const Home = () => {
  const isDark = true;
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("rust");
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

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
    const handleMouseMove = (e: MouseEvent) =>
      setMousePosition({ x: e.clientX, y: e.clientY });
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
      { threshold: 0.3, rootMargin: "0px 0px -20% 0px" },
    );
    sectionsRef.current.forEach((s) => {
      if (s) observer.observe(s);
    });
    return () => observer.disconnect();
  }, []);

  // Auto-enter play mode if ?play param is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sails") === "true") setIsPlaying(true);
  }, []);

  // Lock body scroll while the game is active
  useEffect(() => {
    document.body.style.overflow = isPlaying ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPlaying]);

  const switchTheme = (theme: ThemeKey) => setActiveTheme(theme);
  const enterPlay = () => setIsPlaying(true);
  const exitPlay = () => setIsPlaying(false);

  return (
    <div className="min-h-screen text-foreground relative overflow-hidden">
      {/* ── Sailing game — always renders in the background ─────────────── */}
      <PirateSailingGame playMode={isPlaying} onExitPlay={exitPlay} />

      {/* ── "Set Sail" CTA — fixed button, own fade so it doesn't compete with overlay timing ── */}
      <button
        onClick={enterPlay}
        className="fixed bottom-10 left-1/2 z-40 flex items-center gap-2 px-6 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/25 text-white text-sm font-mono hover:bg-white/10 hover:border-white/50 transition-all duration-300 cursor-pointer"
        style={{
          opacity: isPlaying ? 0 : 1,
          pointerEvents: isPlaying ? "none" : "auto",
          transform: `translateX(-50%) translateY(${isPlaying ? "8px" : "0px"})`,
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        <span className="text-base">⛵</span>
        <span>Set Sail</span>
      </button>

      {/* ── Portfolio overlay — fades away when the user is playing ──────── */}
      <div
        className="transition-opacity duration-700"
        style={{
          opacity: isPlaying ? 0 : 1,
          pointerEvents: isPlaying ? "none" : "auto",
          willChange: "opacity",
        }}
      >
        {/* Dark tint + quicker fade to solid background so content is always legible */}
        <div
          className="fixed inset-0 pointer-events-none h-full w-full"
          style={{
            zIndex: -5,
            background: `linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.35) 35vh, var(--background) 65vh)`,
          }}
        />
        <div
          className="fixed inset-0 gradient-mesh pointer-events-none"
          style={{ opacity: 0.25 }}
        />
        <div
          className="fixed inset-0 opacity-15 pointer-events-none transition-opacity duration-300 z-0"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--bg-1), transparent 40%)`,
          }}
        />

        <ScrollIndicator activeSection={activeSection} />

        <div className="fixed inset-0 backdrop-blur-[2px] pointer-events-none" />
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
            <ProjectsSection
              activeTheme={activeTheme}
              sectionsRef={sectionsRef}
            />
            <ThoughtsSection
              activeTheme={activeTheme}
              sectionsRef={sectionsRef}
            />
            <ConnectSection
              activeTheme={activeTheme}
              sectionsRef={sectionsRef}
            />
            <Footer onSailClick={enterPlay} />
        </main>

        <div className="fixed bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
};

export default Home;
