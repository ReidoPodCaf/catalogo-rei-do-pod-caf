/** @type {import('tailwindcss').Config} */
module.exports = {
  // Arquivos onde o Tailwind procura classes. Mudou classe em algum deles?
  // Rode `npm run build:css` para regerar o tailwind.css.
  content: ["./*.html", "./*.js", "!./tailwind.config.js"],
  theme: {
    extend: {
      // Dourado tirado do logo (leão)
      colors: {
        ouro: { claro: "#f3dc8a", DEFAULT: "#e6c766", escuro: "#b8862f" },
        fundo: "#0a0a0b",
        superficie: "#141416",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Barlow Condensed"', "Inter", "sans-serif"],
      },
    },
  },
};
