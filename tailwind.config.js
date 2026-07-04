/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // 暖调深色底
        ink: {
          950: "#100D0A",
          900: "#14110F",
          850: "#1A1612",
          800: "#1E1A16",
          700: "#2A241E",
          600: "#3A322A",
          500: "#4E4438",
        },
        // 暖琥珀金强调色
        amber: {
          DEFAULT: "#E8A33D",
          50: "#FBF1DC",
          100: "#F6E2BA",
          200: "#EFCB86",
          300: "#E8A33D",
          400: "#D98C24",
          500: "#B4720F",
          600: "#8A5710",
        },
        // 纸张米白文字
        paper: {
          DEFAULT: "#F2EBE0",
          muted: "#C9BFB0",
          dim: "#8B8273",
          faint: "#5E564A",
        },
        // 辅助：墨绿（用于成功/已发布）
        moss: {
          DEFAULT: "#7FA66A",
          dim: "#5A7A4A",
        },
        // 辅助：朱砂（用于删除/错误）
        clay: {
          DEFAULT: "#C9694E",
          dim: "#8C4634",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Newsreader"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
        "3xl": "24px",
      },
      boxShadow: {
        glow: "0 0 40px -12px rgba(232, 163, 61, 0.45)",
        card: "0 10px 30px -12px rgba(0, 0, 0, 0.6), 0 1px 0 0 rgba(232, 163, 61, 0.08) inset",
        inset: "inset 0 1px 0 0 rgba(255, 255, 255, 0.04)",
      },
      backgroundImage: {
        "warm-glow": "radial-gradient(120% 80% at 50% -10%, rgba(232, 163, 61, 0.10) 0%, rgba(232, 163, 61, 0) 60%)",
        "paper-grain": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "sheet-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "amber-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.3s ease both",
        "sheet-up": "sheet-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) both",
        "amber-pulse": "amber-pulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
