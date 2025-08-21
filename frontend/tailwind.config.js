/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--color-background)',
                surface: 'var(--color-surface)',
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                },
                secondary: 'var(--color-secondary)',
                'text-base': 'var(--color-text-base)',
                'text-muted': 'var(--color-text-muted)',
                border: 'var(--color-border)',
            },
        },
    },
    plugins: [],
}
