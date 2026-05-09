/**
 * Bundle Analyzer Configuration
 * Configuration for react-native-bundle-visualizer
 */

module.exports = {
  // Bundle output directory
  outputDir: './bundle-analysis',
  
  // Platforms to analyze
  platforms: ['ios', 'android'],
  
  // Bundle types to analyze
  bundleTypes: ['main', 'module'],
  
  // Entry files
  entryFiles: {
    ios: './client/App.tsx',
    android: './client/App.tsx',
  },
  
  // Metro configuration
  metroConfig: './metro.config.js',
  
  // Analysis options
  analysis: {
    // Show detailed module breakdown
    showModuleDetails: true,
    
    // Group similar modules
    groupModules: true,
    
    // Show duplicate modules
    showDuplicates: true,
    
    // Show unused dependencies
    showUnused: true,
    
    // Size thresholds for warnings
    sizeThresholds: {
      total: 10 * 1024 * 1024, // 10MB
      module: 500 * 1024, // 500KB
      asset: 100 * 1024, // 100KB
    },
  },
  
  // Reporting options
  reporting: {
    // Generate HTML report
    html: true,
    
    // Generate JSON report
    json: true,
    
    // Generate CSV report
    csv: true,
    
    // Include source maps in analysis
    includeSourceMaps: false,
  },
  
  // Optimization suggestions
  optimization: {
    // Suggest code splitting
    suggestCodeSplitting: true,
    
    // Suggest tree shaking
    suggestTreeShaking: true,
    
    // Suggest dynamic imports
    suggestDynamicImports: true,
    
    // Suggest asset optimization
    suggestAssetOptimization: true,
  },
  
  // Exclusions
  exclude: [
    '**/node_modules/**/test/**',
    '**/node_modules/**/tests/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/coverage/**',
  ],
  
  // Inclusions (if specified, only these will be analyzed)
  include: [
    './client/**/*.{ts,tsx,js,jsx}',
  ],
};
