// Brand theme shared by tailwind.config.js (kept separate so it is easy to edit).
export default {
  extend: {
    colors: {
      navy: { 50: '#eef3fb', 100: '#d6e1f3', 300: '#8aa3cc', 600: '#1e3a6e', 700: '#152c56', 800: '#0f2245', 900: '#0a1834', 950: '#06101f' },
      gold: { 100: '#fff4d1', 300: '#ffd866', 400: '#fcc419', 500: '#f2ad00', 600: '#c98a00' },
      saffron: { 400: '#ff9a3c', 500: '#f57c00', 600: '#d96500' },
    },
    fontFamily: {
      display: ['Poppins', 'system-ui', 'sans-serif'],
      sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      marathi: ['Mukta', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
    },
    boxShadow: {
      card: '0 1px 2px rgba(10,24,52,.06), 0 12px 32px -12px rgba(10,24,52,.25)',
    },
    keyframes: {
      rise: { '0%': { opacity: 0, transform: 'translateY(18px)' }, '100%': { opacity: 1, transform: 'none' } },
      drive: { '0%': { transform: 'translateX(-6px)' }, '50%': { transform: 'translateX(6px)' }, '100%': { transform: 'translateX(-6px)' } },
      spinwheel: { to: { transform: 'rotate(360deg)' } },
    },
    animation: {
      rise: 'rise .7s cubic-bezier(.2,.7,.2,1) both',
      drive: 'drive 4s ease-in-out infinite',
    },
  },
};
