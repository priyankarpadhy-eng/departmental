/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Antigravity neutral palette
        surface: {
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          tertiary: 'var(--surface-tertiary)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        border: 'var(--border-color)',
        // Role accents
        admin: {
          DEFAULT: '#E24B4A',
          light: '#FDEDED',
          dark: '#B83B3A',
        },
        hod: {
          DEFAULT: '#534AB7',
          light: '#EEEDF9',
          dark: '#3F379A',
        },
        faculty: {
          DEFAULT: '#185FA5',
          light: '#E8F0F9',
          dark: '#124B83',
        },
        student: {
          DEFAULT: '#0F6E56',
          light: '#E7F4F0',
          dark: '#0A5242',
        },
        alumni: {
          DEFAULT: '#854F0B',
          light: '#F5EDE2',
          dark: '#6A3F09',
        },
      },
      borderRadius: {
        card: '12px',
        badge: '20px',
        button: '8px',
      },
      spacing: {
        sidebar: '220px',
        'content-max': '1200px',
      },
      fontSize: {
        'page-title': ['22px', { lineHeight: '1.3', fontWeight: '500' }],
        'section-heading': ['16px', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        secondary: ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        badge: ['11px', { lineHeight: '1', fontWeight: '500' }],
      },
      transitionDuration: {
        fast: '150ms',
      },
    },
  },
  plugins: [],
}
