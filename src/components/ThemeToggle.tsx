import { useEffect, useState } from "react";

const STORAGE_KEY = "eco-fleet-theme";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const isDark = stored ? stored === "dark" : true;
    setDark(isDark);
    applyTheme(isDark);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className="group relative h-9 w-[68px] shrink-0 overflow-hidden rounded-full border border-border bg-secondary/70 transition-colors duration-500 hover:border-primary/60"
    >
      {/* starfield (dark) */}
      <span
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          dark ? "opacity-100" : "opacity-0"
        }`}
      >
        {[
          [14, 8],
          [26, 20],
          [40, 10],
          [50, 24],
          [20, 28],
        ].map(([x, y], i) => (
          <span
            key={i}
            className="animate-twinkle absolute size-[3px] rounded-full bg-mint"
            style={{ left: x, top: y, animationDelay: `${i * 0.35}s` }}
          />
        ))}
      </span>

      {/* golden flare (light) */}
      <span
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_50%,var(--warn-soft),transparent_65%)] transition-opacity duration-500 ${
          dark ? "opacity-0" : "opacity-100"
        }`}
      />

      <span
        className="absolute top-1 grid size-7 place-items-center rounded-full shadow-card transition-all duration-500 ease-[cubic-bezier(0.68,-0.4,0.27,1.4)]"
        style={{
          left: dark ? 4 : 36,
          background: dark ? "var(--card)" : "var(--warn)",
          transform: mounted ? `rotate(${dark ? -25 : 0}deg)` : undefined,
        }}
      >
        {dark ? (
          <svg viewBox="0 0 24 24" className="size-4 text-mint" aria-hidden="true">
            <path
              d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
              fill="currentColor"
              style={{ filter: "drop-shadow(0 0 6px currentColor)" }}
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="animate-spin-slow size-4 text-warn-soft"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            {Array.from({ length: 8 }).map((_, i) => (
              <rect
                key={i}
                x="11.2"
                y="0.6"
                width="1.6"
                height="4"
                rx="0.8"
                fill="currentColor"
                transform={`rotate(${i * 45} 12 12)`}
              />
            ))}
          </svg>
        )}
      </span>
    </button>
  );
}
