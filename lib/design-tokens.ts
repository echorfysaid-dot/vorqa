export const vorqaTokens = {
  colors: {
    background: {
      app: "#070808",
      elevated: "#0C0E0F",
      navy: "#111416",
      surface: "rgba(17, 19, 20, 0.92)",
      surfaceRaised: "rgba(24, 26, 27, 0.96)"
    },
    accent: {
      gold: "#D6A84B",
      goldBright: "#F0CE7A",
      goldDark: "#8D6728",
      blue: "#5B8DEF",
      cyan: "#55BFD8"
    },
    semantic: {
      success: "#22C783",
      warning: "#F5B942",
      danger: "#EF5B5B",
      info: "#4F8CFF"
    },
    text: {
      primary: "#F6F7FA",
      secondary: "#B5B7B8",
      muted: "#7C8082",
      inverse: "#070808"
    },
    border: {
      default: "rgba(255, 255, 255, 0.085)",
      strong: "rgba(255, 255, 255, 0.14)",
      gold: "rgba(214, 168, 75, 0.32)",
      blue: "rgba(79, 140, 255, 0.30)"
    },
    legacy: {
      creamText: "#F8EFD7",
      activeGold: "#D4AF37",
      warmGold: "#F1CF72",
      warmGoldBorder: "#E6C46A",
      surfaceSolid: "#181C24",
      shellBg: "#090B10"
    }
  },
  typography: {
    fontFamily: {
      arabic: '"Segoe UI", Tahoma, Arial, "Noto Sans Arabic", "Geeza Pro", sans-serif',
      latin: 'Inter, "Segoe UI", Arial, sans-serif',
      mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
    },
    size: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem"
    },
    weight: {
      regular: 400,
      medium: 500,
      bold: 700,
      black: 900
    },
    lineHeight: {
      tight: 1.1,
      heading: 1.18,
      normal: 1.55,
      relaxed: 1.8
    }
  },
  radius: {
    sm: "0.5rem",
    md: "0.625rem",
    lg: "0.75rem",
    xl: "0.875rem",
    "2xl": "1rem",
    full: "999px"
  },
  spacing: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem"
  },
  shadow: {
    sm: "0 8px 22px rgba(0, 0, 0, 0.24)",
    md: "0 18px 48px rgba(0, 0, 0, 0.34)",
    lg: "0 30px 80px rgba(0, 0, 0, 0.44)",
    xl: "0 44px 110px rgba(0, 0, 0, 0.52)",
    gold: "0 12px 38px rgba(214, 168, 75, 0.18)",
    blue: "0 0 64px rgba(79, 140, 255, 0.24)",
    cyan: "0 0 70px rgba(81, 216, 255, 0.24)"
  },
  elevation: {
    flat: "none",
    card: "0 8px 22px rgba(0, 0, 0, 0.24)",
    raised: "0 18px 48px rgba(0, 0, 0, 0.34)",
    overlay: "0 30px 80px rgba(0, 0, 0, 0.44)",
    modal: "0 44px 110px rgba(0, 0, 0, 0.52)"
  },
  blur: {
    sm: "12px",
    md: "20px",
    lg: "28px",
    xl: "40px"
  },
  gradients: {
    gold: "linear-gradient(135deg, #F3D584, #D6A84B 52%, #A77A2D)",
    blue: "linear-gradient(135deg, #51D8FF, #4F8CFF)",
    surface: "linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.018))",
    app: "radial-gradient(circle at 72% 8%, rgba(214,168,75,.07), transparent 24%), linear-gradient(145deg, #070808, #0C0E0F 55%, #050606)"
  },
  motion: {
    duration: {
      fast: "160ms",
      base: "240ms",
      slow: "420ms",
      slower: "700ms"
    },
    easing: {
      out: "cubic-bezier(0.22, 1, 0.36, 1)",
      in: "cubic-bezier(0.64, 0, 0.78, 0)",
      standard: "cubic-bezier(0.4, 0, 0.2, 1)"
    }
  },
  zIndex: {
    base: 0,
    dropdown: 30,
    sticky: 40,
    overlay: 90,
    modal: 100,
    toast: 110
  }
} as const;

export type VorqaTokens = typeof vorqaTokens;
