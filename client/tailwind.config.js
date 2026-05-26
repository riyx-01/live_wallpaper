/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: '#FFF5F7',       // soft warm pink bg
          accent: '#F9C6D0',   // medium baby pink accent
          primary: '#E88FA0',  // darker baby pink / rose primary
          dark: '#6B3A4D',     // deep cocoa-pink text dark
          cream: '#FDF0DC',    // warm soft cream
          gold: '#D4A96A',     // elegant gold
          whiteglass: 'rgba(255, 255, 255, 0.4)',
          pinkglass: 'rgba(255, 240, 245, 0.45)',
        }
      },
      fontFamily: {
        ui: ['Lato', 'Inter', 'sans-serif'],
        wallpaperSerif: ['"Playfair Display"', 'serif'],
        wallpaperHandwritten: ['"Dancing Script"', 'cursive'],
        wallpaperSans: ['Inter', 'sans-serif'],
        wallpaperBold: ['"Outfit"', 'sans-serif']
      },
      animation: {
        'cloud-slow': 'floatCloud 60s linear infinite',
        'cloud-medium': 'floatCloud 45s linear infinite',
        'cloud-fast': 'floatCloud 30s linear infinite',
        'heart-rise': 'heartRise 4s ease-out forwards',
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        floatCloud: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100vw)' }
        },
        heartRise: {
          '0%': {
            transform: 'translateY(0) scale(0.5) rotate(0deg)',
            opacity: '0'
          },
          '10%': {
            opacity: '0.8'
          },
          '90%': {
            opacity: '0.8'
          },
          '100%': {
            transform: 'translateY(-115vh) scale(1.2) rotate(360deg)',
            opacity: '0'
          }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(232, 143, 160, 0.15)',
        'glass-hover': '0 12px 40px 0 rgba(232, 143, 160, 0.25)',
        'soft': '0 10px 30px -10px rgba(107, 58, 77, 0.1)',
      }
    },
  },
  plugins: [],
}
