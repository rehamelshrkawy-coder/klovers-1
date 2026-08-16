import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindTypography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		// NOTE: supplying `screens` REPLACES Tailwind's breakpoint set for
  		// `.container` — it does not merge. An `xs: '400px'` entry here used to
  		// cap every viewport from 400px to 1399px at 400px wide, which collapsed
  		// the whole site into a ribbon on a 1366x768 laptop. Only widen here.
  		screens: {
  			sm: '640px',
  			md: '768px',
  			lg: '1024px',
  			xl: '1280px',
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		// `h-13` is used on the primary conversion button in several places but
  		// is not on Tailwind's spacing scale, so it was silently dropped at build
  		// time and those buttons rendered at their default height.
  		spacing: {
  			'13': '3.25rem'
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))',
  				// Readable brand accent for TEXT. --primary is pure spectral
  				// yellow: superb as a background (black-on-yellow is 19.6:1) and
  				// unusable as a foreground (1.07:1 on white). Use `text-primary-text`
  				// for any brand-coloured text/icon; keep `bg-primary` as-is.
  				text: 'hsl(var(--primary-text))'
  			},
  			whatsapp: {
  				DEFAULT: 'hsl(var(--whatsapp))',
  				foreground: 'hsl(var(--whatsapp-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		// Monotonic radius ramp, every step derived from --radius so changing the
  		// token actually re-skins the site. Previously `md` (14px) was larger than
  		// `xl` (12px, stock Tailwind) and `sm` equalled `xl`.
  		borderRadius: {
  			sm: 'calc(var(--radius) - 8px)',
  			DEFAULT: 'calc(var(--radius) - 6px)',
  			md: 'calc(var(--radius) - 4px)',
  			lg: 'calc(var(--radius) - 2px)',
  			xl: 'var(--radius)',
  			'2xl': 'calc(var(--radius) + 4px)',
  			'3xl': 'calc(var(--radius) + 8px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' },
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' },
  			},
  			'scroll-left': {
  				'0%': { transform: 'translateX(0)' },
  				'100%': { transform: 'translateX(-50%)' },
  			},
  			'scroll-right': {
  				'0%': { transform: 'translateX(-50%)' },
  				'100%': { transform: 'translateX(0)' },
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'scroll-left': 'scroll-left 35s linear infinite',
  			'scroll-right': 'scroll-right 35s linear infinite',
  		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		},
  		fontFamily: {
  			sans: [
  				// unicode-range-gated to Arabic (see index.css @font-face), so Latin
  				// text falls through to the system stack with zero extra requests.
  				'Noto Sans Arabic',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			serif: [
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		}
  	}
  },
  plugins: [tailwindcssAnimate, tailwindTypography],
} satisfies Config;
