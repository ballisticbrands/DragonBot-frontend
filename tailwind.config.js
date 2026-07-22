/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Shared package's compiled JS — Tailwind JIT needs to see the
    // class names used inside <Turnstile>, <VerifyEmailBanner>,
    // <ForgotPasswordPage>, etc., otherwise the utilities they
    // reference (bg-amber-50, my-2, etc.) won't be in the CSS bundle.
    './node_modules/@ballisticbrands/frontend-shared/dist/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'],
        mono: ["'Roboto Mono'", 'monospace'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
};
