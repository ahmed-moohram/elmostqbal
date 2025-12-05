/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#e9effd",
          100: "#c7d7fa",
          200: "#a5bff7",
          300: "#83a7f4",
          400: "#618ff1",
          500: "#4169e1", // الأزرق الملكي (Royal Blue)
          600: "#2c53d6",
          700: "#1f3cb0",
          800: "#15298a",
          900: "#0a1464",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "#fefaec",
          100: "#fdf1c8",
          200: "#fbe8a4",
          300: "#fade80",
          400: "#f9d55c",
          500: "#ffd700", // الذهبي (Gold)
          600: "#d4b401",
          700: "#aa9001",
          800: "#806c01",
          900: "#564800",
        },
        navy: {
          DEFAULT: "#0a1030", // الكحلي الداكن (Dark Navy)
          50: "#f0f1f7",
          100: "#d2d5e8",
          200: "#b4b9d8",
          300: "#959ec9",
          400: "#7782b9",
          500: "#5967aa",
          600: "#455299",
          700: "#313f86",
          800: "#1e2c74",
          900: "#0a1030", // الكحلي الداكن (Dark Navy)
        },
        brown: {
          DEFAULT: "#3d2a14", // البني الداكن (Dark Brown)
          50: "#f8f4f0",
          100: "#e9dfD3",
          200: "#d9cbb6",
          300: "#c9b698",
          400: "#b9a27b",
          500: "#a98e5e",
          600: "#8a7443",
          700: "#6b5b27",
          800: "#4c410b",
          900: "#3d2a14", // البني الداكن (Dark Brown)
        },
        gold: {
          DEFAULT: "#b28d1c", // الذهبي الغامق (Deep Gold)
          50: "#fdf8e9",
          100: "#f9eac6",
          200: "#f5dca3",
          300: "#f1ce7f",
          400: "#ecc05c",
          500: "#e7b239",
          600: "#d2a133",
          700: "#b28d1c", // الذهبي الغامق (Deep Gold)
          800: "#7d621d",
          900: "#5f481b",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "gradient-x": "gradient-x 15s ease infinite",
        "gradient-y": "gradient-y 15s ease infinite",
        "gradient-xy": "gradient-xy 15s ease infinite",
        "spin-slow": "spin 3s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        "gradient-y": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "center top"
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "center center"
          }
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center"
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center"
          }
        },
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center"
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center"
          }
        },
        "shimmer": {
          "0%": {
            "background-position": "-1000px 0"
          },
          "100%": {
            "background-position": "1000px 0"
          },
        }
      },
      boxShadow: {
        'royal': '0 4px 14px 0 rgba(65, 105, 225, 0.2)',
        'royal-lg': '0 10px 25px -3px rgba(65, 105, 225, 0.25), 0 4px 6px -2px rgba(65, 105, 225, 0.1)',
        'gold': '0 4px 14px 0 rgba(255, 215, 0, 0.25)',
        'gold-lg': '0 10px 25px -3px rgba(255, 215, 0, 0.2), 0 4px 6px -2px rgba(255, 215, 0, 0.15)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 