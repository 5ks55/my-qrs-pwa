/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        // Custom font configuration
        sans: ['"Istok Web"', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Mapping CSS variables to Tailwind color utility classes
      colors: {
        // Backgrounds
        'bg-color': 'var(--bg-color)',
        'card-bg': 'var(--card-bg)',
        'glass-bg': 'var(--glass-bg)',
        'form-bg': 'var(--form-bg)',
        'form-object': 'var(--form-object)',
        'input-bg': 'var(--input-bg)',

        // Typography
        'text-color': 'var(--text-color)',
        'list-name': 'var(--list-name-category-text-color)',
        'input-placeholder': 'var(--input-placeholder)',

        // UI Elements
        'system-blue': 'var(--system-blue)',
        'system-red': 'var(--system-red)',
        'indicator-yellow': 'var(--indicator-yellow)',
        'separator': 'var(--separator-color)',
        'btn-neutral': 'var(--btn-neutral)',
        'clear-btn': 'var(--clear-btn-bg)',
        'close-icon': 'var(--close-color)',
      },
      // Custom border radius values
      borderRadius: {
        'card': '26px',
        'modal': '38px',
      }
    },
  },
  plugins: [],
}