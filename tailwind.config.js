/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0E17',
          800: '#111627',
          700: '#1A1F35',
          600: '#232946',
          500: '#2D3352',
        },
        accent: {
          orange: '#E8751A',
          orangeLight: '#F4A259',
          blue: '#1A5C9E',
          blueLight: '#3B82F6',
          green: '#2ECC71',
          red: '#E83A3A',
          yellow: '#F5C518',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
