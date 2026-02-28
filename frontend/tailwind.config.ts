import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        foreground: 'hsl(var(--foreground))',
        background: 'hsl(var(--background))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        gray: {
          850: '#1a1a1a',
          920: '#171717',
          950: '#0a0a0a',
        },
      },
      boxShadow: {
        glass: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glass-dark': '0 0 0 1px rgba(255, 255, 255, 0.03)',
      },
    },
  },
  plugins: [],
};

export default config;
