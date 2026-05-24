import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["src/public/assets/build/**"],
  },
  {
    files: ["src/frontend/**/*.{js,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z]" }],
    },
  },
  {
    files: ["tests/**/*.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, ...globals.jest },
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    ignores: ["src/frontend/**/*.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
  },
]);
