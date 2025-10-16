/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/utils/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          sky: "#38bdf8",
          emerald: "#16a34a",
          amber: "#d97706",
          royal: "#2563eb",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular"],
      },
      boxShadow: {
        glow: "0 0 60px rgba(56, 189, 248, 0.15)",
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.12), transparent 50%), radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.1), transparent 45%), radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.1), transparent 55%)",
      },
    },
  },
  plugins: [],
};
