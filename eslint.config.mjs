import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import expoConfig from "eslint-config-expo/flat.js";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier/recommended";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  // Base Expo config
  ...expoConfig,

  // TypeScript config
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: true,
        tsconfigRootDir: resolve(__dirname),
      },
    },
    rules: {
      // TypeScript strict rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",

      // React rules
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
      "react/no-unused-prop-types": "error",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",

      // Console restrictions - only allow error in production
      "no-console": [
        "warn",
        { allow: ["error", "warn", "info", "debug", "log", "time", "timeEnd"] },
      ],

      // General best practices
      "no-unused-expressions": "error",
      "no-param-reassign": ["error", { props: false }],
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },

  // App source: relax rules that conflict with legacy screens and RN patterns
  {
    files: ["client/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react/no-unused-prop-types": "off",
      "react/no-unescaped-entities": "warn",
      "import/no-unresolved": "off",
    },
  },

  // Test file overrides
  {
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        it: "readonly",
      },
      parserOptions: {
        project: false,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-useless-constructor": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
      "no-undef": "off",
    },
  },

  {
    files: ["**/test-utils/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        it: "readonly",
      },
      parserOptions: {
        project: false,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "no-undef": "off",
    },
  },

  {
    files: ["**/test-utils/**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        jest: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "no-undef": "off",
    },
  },

  // Prettier integration
  prettierConfig,
  prettierPlugin,

  // Ignore patterns
  {
    ignores: [
      ".kilo/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".expo/**",
      "*.config.js",
      "*.config.ts",
      "server_dist/**",
      "server/**",
      "shared/**",
      "jest.setup.js",
    ],
  },
];
