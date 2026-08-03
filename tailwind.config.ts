import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Cairo",
          "Tahoma",
          "Arial",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      colors: {
        navy: "#070808",
        ink: "#111416",
        electric: "#D4AF37",
        purpleSoft: "#4F8CFF",
        mist: "#111416",
        surface: "#181A1B",
        gold: "#D4AF37",
        blue: "#4F8CFF",
        success: "#16C784",
        warning: "#FFB020",
        danger: "#EF4444",
        "ds-bg": "#070808",
        "ds-secondary": "#0C0E0F",
        "ds-surface": "#181A1B",
        "ds-border": "rgba(255,255,255,0.10)",
        "ds-text": "#F8EFD7",
        "ds-muted": "rgba(248,239,215,0.58)",
        "ds-token-bg": "var(--ds-bg)",
        "ds-token-secondary": "var(--ds-secondary)",
        "ds-token-navy": "var(--ds-navy)",
        "ds-token-surface": "var(--ds-surface)",
        "ds-token-surface-raised": "var(--ds-surface-raised)",
        "ds-token-surface-interactive": "var(--ds-surface-interactive)",
        "ds-token-overlay": "var(--ds-overlay)",
        "ds-token-gold": "var(--ds-gold)",
        "ds-token-gold-bright": "var(--ds-gold-bright)",
        "ds-token-gold-dark": "var(--ds-gold-dark)",
        "ds-token-blue": "var(--ds-blue)",
        "ds-token-cyan": "var(--ds-cyan)",
        "ds-token-success": "var(--ds-success)",
        "ds-token-warning": "var(--ds-warning)",
        "ds-token-danger": "var(--ds-danger)",
        "ds-token-info": "var(--ds-info)",
        "ds-token-text": "var(--ds-text)",
        "ds-token-muted": "var(--ds-muted)",
        "ds-token-muted-soft": "var(--ds-muted-soft)",
        "ds-token-border": "var(--ds-border)",
        "ds-token-border-strong": "var(--ds-border-strong)",
        "ds-token-border-gold": "var(--ds-border-gold)",
        "ds-token-border-blue": "var(--ds-border-blue)"
      },
      borderRadius: {
        "ds-sm": "var(--ds-radius-sm)",
        "ds-md": "var(--ds-radius-md)",
        "ds-lg": "var(--ds-radius-lg)",
        "ds-xl": "var(--ds-radius-xl)",
        "ds-2xl": "var(--ds-radius-2xl)"
      },
      spacing: {
        "ds-1": "0.25rem",
        "ds-2": "0.5rem",
        "ds-3": "0.75rem",
        "ds-4": "1rem",
        "ds-5": "1.25rem",
        "ds-6": "1.5rem",
        "ds-8": "2rem",
        "ds-10": "2.5rem",
        "ds-12": "3rem",
        "ds-16": "4rem",
        "ds-20": "5rem",
        "ds-24": "6rem"
      },
      boxShadow: {
        glow: "0 12px 38px rgba(214, 168, 75, 0.18)",
        "ds-sm": "0 10px 30px rgba(0, 0, 0, 0.22)",
        "ds-md": "0 24px 70px rgba(0, 0, 0, 0.32)",
        "ds-lg": "0 40px 120px rgba(0, 0, 0, 0.45)",
        "ds-xl": "var(--ds-shadow-xl)",
        "ds-token-sm": "var(--ds-shadow-sm)",
        "ds-token-md": "var(--ds-shadow-md)",
        "ds-token-lg": "var(--ds-shadow-lg)",
        "ds-token-xl": "var(--ds-shadow-xl)",
        "gold-glow": "0 12px 38px rgba(214, 168, 75, 0.18)",
        "blue-glow": "0 0 55px rgba(79, 140, 255, 0.20)",
        "token-gold-glow": "var(--ds-glow-gold)",
        "token-blue-glow": "var(--ds-glow-blue)",
        "token-cyan-glow": "var(--ds-glow-cyan)"
      },
      transitionTimingFunction: {
        "ds-out": "cubic-bezier(0.22, 1, 0.36, 1)",
        "ds-in": "cubic-bezier(0.64, 0, 0.78, 0)",
        "ds-standard": "var(--ds-ease-standard)"
      },
      transitionDuration: {
        "ds-fast": "120ms",
        "ds-base": "180ms",
        "ds-slow": "240ms",
        "ds-slower": "300ms"
      },
      maxWidth: {
        "ds-content": "var(--ds-content-max)",
        "ds-reading": "var(--ds-reading-max)",
        "ds-form": "var(--ds-form-max)"
      },
      minHeight: {
        "ds-control-sm": "var(--ds-control-height-sm)",
        "ds-control": "var(--ds-control-height)",
        "ds-control-lg": "var(--ds-control-height-lg)"
      },
      gridTemplateColumns: {
        "ds-dashboard": "repeat(12, minmax(0, 1fr))"
      },
      backgroundImage: {
        "ds-radial": "radial-gradient(circle at 72% 8%, rgba(214,168,75,0.08), transparent 26%)",
        "ds-surface": "linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018))",
        "gold-linear": "linear-gradient(135deg, #F3D584, #D6A84B 52%, #A77A2D)",
        "ds-token-app": "var(--ds-gradient-app)",
        "ds-token-gold": "var(--ds-gradient-gold)",
        "ds-token-blue": "var(--ds-gradient-blue)",
        "ds-token-surface": "var(--ds-gradient-surface)"
      },
      keyframes: {
        "ds-fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "ds-glow": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.95", transform: "scale(1.06)" }
        }
      },
      animation: {
        "ds-fade-up": "ds-fade-up 420ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "ds-glow": "ds-glow 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
