/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: { 500: "#FF9933", 600: "#E68A2E" },
        india: {
          green: "#138808",
          blue: "#000080",
        },
      },
    },
  },
  plugins: [],
};
