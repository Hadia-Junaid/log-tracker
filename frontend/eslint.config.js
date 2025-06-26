import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Base configuration for all files
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { 
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  },

  // TypeScript configuration
  ...tseslint.configs.recommended,

  // React configuration
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      // React recommended rules
      ...pluginReact.configs.recommended.rules,
      ...pluginReact.configs["jsx-runtime"].rules,
      
      // React Hooks rules
      ...pluginReactHooks.configs.recommended.rules,
      
      // React Refresh rules
      ...pluginReactRefresh.configs.recommended.rules,

      // Custom React rules
      "react/prop-types": "off", // Using TypeScript for prop validation
      "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
      "react/jsx-uses-react": "off", // Not needed with new JSX transform
      "react/jsx-uses-vars": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-target-blank": "error",
      "react/jsx-curly-brace-presence": ["error", { "props": "never", "children": "never" }],
    }
  },

  // General rules for all files
  {
    rules: {
      // Basic code quality rules
      "no-console": "warn",
      "no-debugger": "error",
      "no-unused-vars": "off", // TypeScript handles this
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "prefer-const": "error",
      "no-var": "error",

      // Import/export rules
      "import/no-unresolved": "off", // TypeScript handles this
      "import/named": "off", // TypeScript handles this
      "import/default": "off", // TypeScript handles this
      "import/namespace": "off", // TypeScript handles this
    }
  },

  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.ts",
      "vite.config.ts"
    ]
  }
]);
