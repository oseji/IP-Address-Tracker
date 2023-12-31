/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        backgroundDesktop: "url('./src/assets/pattern-bg-desktop.png')",

        backgroundMobile: "url('./src/assets/pattern-bg-mobile.png')",
      },
      height: {
        desktopScreen: "80vh",
        phoneScreen: "60vh",
      },
    },
  },
  plugins: [],
};
