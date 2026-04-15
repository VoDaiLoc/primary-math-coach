import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Brand palette (Oceanic-Azure theme) ── */
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          dark: "hsl(var(--primary-dark))",
        },
        /* Named palette swatches */
        oceanic:  "#002B8C",   /* Oceanic Azure — darkest navy */
        sapphire: "#0F52BA",   /* Sapphire — main CTA blue    */
        dusk:     "#3E5D8E",   /* Dusk Blue — mid tone        */
        azure:    "#F0FFFF",   /* Azure — near-white tint     */
        indigo:   "#282888",   /* Indigo Blue — deep purple   */

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        /* Semantic status colors */
        success: {
          DEFAULT: "#22c55e",
          light: "#dcfce7",
          foreground: "#15803d",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fef3c7",
          foreground: "#92400e",
        },
        danger: {
          DEFAULT: "#ef4444",
          light: "#fee2e2",
          foreground: "#b91c1c",
        },
        /* Neutral aliases */
        neutral: {
          50: "#f0f4fc",
          100: "#e8eef8",
          200: "#d5ddf0",
          300: "#b8c4de",
          400: "#8a9abf",
          500: "#5f6e94",
          600: "#44527a",
          700: "#2d3a5e",
          800: "#1a2440",
          900: "#0d1528",
        },
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "24px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,43,140,.07), 0 1px 2px rgba(0,43,140,.05)",
        DEFAULT: "0 4px 16px rgba(0,43,140,.10), 0 2px 4px rgba(0,43,140,.05)",
        md: "0 4px 16px rgba(0,43,140,.10), 0 2px 4px rgba(0,43,140,.05)",
        lg: "0 10px 32px rgba(0,43,140,.14)",
        xl: "0 20px 48px rgba(0,43,140,.18)",
        primary: "0 4px 14px rgba(15,82,186,.40)",
        "primary-lg": "0 6px 24px rgba(15,82,186,.45)",
        "navy": "0 4px 20px rgba(0,43,140,.30)",
        success: "0 2px 8px rgba(34,197,94,.30)",
        "glow": "0 0 20px rgba(15,82,186,.25), 0 0 40px rgba(0,43,140,.15)",
      },
      fontFamily: {
        sans: [
          "Segoe UI",
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-4px)" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
      },
      animation: {
        "fade-in-up":    "fade-in-up 0.4s ease-out both",
        "fade-in":       "fade-in 0.3s ease-out both",
        "slide-in-left": "slide-in-left 0.35s ease-out both",
        "scale-in":      "scale-in 0.25s ease-out both",
        shimmer:         "shimmer 2.5s linear infinite",
        float:           "float 3s ease-in-out infinite",
        "pulse-ring":    "pulse-ring 1.2s ease-out infinite",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
