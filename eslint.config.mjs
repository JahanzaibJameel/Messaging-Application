import expoConfig from 'eslint-config-expo/flat';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Base Expo config
  ...expoConfig,
  
  // TypeScript config
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  
  // Prettier integration
  prettierConfig,
  prettierPlugin,
  
  // Custom rules
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      
      // React rules
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react/no-unused-prop-types': 'error',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      
      // Console restrictions - only allow error in production
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      
      // General best practices
      'no-unused-expressions': 'error',
      'no-param-reassign': ['error', { props: false }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
    },
  },
  
  // Test file overrides
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.expo/**',
      '*.config.js',
      '*.config.ts',
      'server_dist/**',
    ],
  }
);
