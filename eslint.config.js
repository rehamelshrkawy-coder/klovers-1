import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

const accessibilityRules = Object.fromEntries(
  Object.entries(jsxA11y.flatConfigs.recommended.rules).map(([rule, value]) => [
    rule,
    Array.isArray(value) ? ["warn", ...value.slice(1)] : "warn",
  ]),
);

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".claude/**",
      ".agents/**",
      ".pnpm-store/**",
      "klovers/**",
      "coverage/**",
      "*.tsbuildinfo",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...accessibilityRules,
      // Deprecated duplicate of label-has-associated-control.
      "jsx-a11y/label-has-for": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Downgraded from error → warn: 483 legacy `as any` casts exist in Lovable-generated
      // code. TypeScript compilation (tsc --noEmit) is the authoritative type-safety gate
      // (currently 0 errors). These warnings serve as a backlog to type properly over time.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}", "src/contexts/**/*.{ts,tsx}"],
    rules: {
      // shadcn modules and context providers intentionally co-export helpers/hooks.
      "react-refresh/only-export-components": "off",
      // Polymorphic UI primitives receive accessible children through props.
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/heading-has-content": "off",
    },
  },
);
