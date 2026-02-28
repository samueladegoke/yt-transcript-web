/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#121212",
        neon: "#00E676",
        electric: "#2962FF",
      },
      boxShadow: {
        panel: "0 10px 30px rgba(0, 0, 0, 0.4)",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(circle at top right, rgba(41, 98, 255, 0.2), transparent 45%), radial-gradient(circle at bottom left, rgba(0, 230, 118, 0.18), transparent 40%)",
      },
    },
  },
  plugins: [],
};
