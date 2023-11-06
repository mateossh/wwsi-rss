/** @type {import("prettier").Config} */
const config = {
  singleQuote: true,
  plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
  tailwindFunctions: ['clsx'],
};

module.exports = config;
