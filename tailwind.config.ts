import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        slate: "#475569",
        line: "#D7DEE8",
        teal: "#0E766C",
        gold: "#A8731A",
        canvas: "#F4F6F8",
        paper: "#FFFFFF",
        navy: "#182230",
        steel: "#64748B",
      },
      boxShadow: {
        soft: "0 12px 30px rgba(15, 23, 42, 0.07)",
        lift: "0 18px 42px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
