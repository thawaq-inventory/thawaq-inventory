/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'selector', // Forces class-based dark mode (controlled by next-themes)
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
