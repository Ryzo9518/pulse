import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        jera: {
          red: '#911431',
          'red-light': '#F5E8EB',
          blue: '#2b72b9',
          'blue-light': '#EBF3FB',
          pink: '#db4fb2',
          'pink-light': '#FBEDF7',
          green: '#2D8A56',
          amber: '#C4880C',
          teal: '#0a7c8a',
        },
        surface: {
          DEFAULT: '#FAF9F7',
          card: '#FFFFFF',
          border: '#E8E4DF',
          'border-light': '#F0ECE8',
          sidebar: '#1a1a1a',
          'sidebar-hover': '#2a2a2a',
        },
        text: {
          DEFAULT: '#1a1a1a',
          muted: '#8C857D',
          secondary: '#6B645C',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        btn: '8px',
        badge: '5px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03)',
        'card-lg': '0 4px 24px rgba(0,0,0,.06)',
        'red-glow': '0 4px 16px #91143120',
      },
    },
  },
  plugins: [],
}

export default config
