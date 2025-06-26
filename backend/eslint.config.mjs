import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Base JavaScript rules
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  
  // CommonJS files
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
  },
  
  // Node.js globals for backend
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { 
      globals: {
        ...globals.node,
        ...globals.es2021,
      }
    },
  },
  
  // TypeScript recommended rules
  ...tseslint.configs.recommended,
  
  // Basic custom rules
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    rules: {
      // Basic TypeScript rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Basic code quality
      "no-console": "warn",
      "no-debugger": "error",
      "no-unused-vars": "off", // Use TypeScript version instead
      "prefer-const": "error",
      
      // Basic formatting
      "indent": ["error", 2],
      "quotes": ["error", "single"],
      "semi": ["error", "always"],
    },
  },
]);
