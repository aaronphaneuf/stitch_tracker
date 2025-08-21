module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],

  daisyui: {
  themes: [
       "light","dark","cupcake","bumblebee","emerald","corporate","synthwave","retro",
       "cyberpunk","valentine","halloween","garden","forest","aqua","lofi","pastel",
       "fantasy","wireframe","black","luxury","dracula","cmyk","autumn","business",
       "acid","lemonade","night","coffee","winter","dim","nord","sunset"
     ],
   },
};
