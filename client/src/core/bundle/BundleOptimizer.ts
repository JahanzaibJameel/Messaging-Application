/**
 * Enterprise Bundle Optimization
 * Code splitting, tree shaking, and bundle analysis
 */

import React from "react";
import { Platform } from "react-native";
import { logger } from "../logger";

// Bundle optimization configuration
export interface BundleConfig {
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  enableMinification: boolean;
  maxChunkSize: number; // KB
  compressionLevel: number; // 0-9
  analyzeBundle: boolean;
}

export const DEFAULT_BUNDLE_CONFIG: BundleConfig = {
  enableCodeSplitting: true,
  enableTreeShaking: true,
  enableMinification: true,
  maxChunkSize: 250, // 250KB chunks
  compressionLevel: 7,
  analyzeBundle: __DEV__,
};

// Bundle analysis results
export interface BundleAnalysis {
  totalSize: number; // KB
  chunkSizes: Record<string, number>;
  largestModules: {
    name: string;
    size: number;
    percentage: number;
  }[];
  compressionRatio: number;
  recommendations: string[];
}

class BundleOptimizerClass {
  private config: BundleConfig;
  private analysis: BundleAnalysis | null = null;

  constructor(config: Partial<BundleConfig> = {}) {
    this.config = { ...DEFAULT_BUNDLE_CONFIG, ...config };
  }

  // Dynamic imports for code splitting
  public lazyLoad = <T>(importFn: () => Promise<T>): Promise<T> => {
    if (!this.config.enableCodeSplitting) {
      logger.warn("Code splitting is disabled");
      return importFn();
    }

    const startTime = Date.now();

    return importFn()
      .then((module) => {
        const loadTime = Date.now() - startTime;
        logger.info("Lazy loaded module", "BundleOptimizer", { loadTime });
        return module;
      })
      .catch((error) => {
        logger.error("Failed to lazy load module:", error);
        throw error;
      });
  };

  // Preload critical modules
  public preloadCriticalModules = async (): Promise<void> => {
    const criticalModules = [
      () => import("@/presentation/stores/authStore"),
      () => import("@/presentation/stores/chatStore"),
      () => import("@/core/sync/SyncEngine"),
      () => import("@/core/logger"),
    ];

    try {
      await Promise.all(
        criticalModules.map((module) =>
          this.lazyLoad(module as () => Promise<typeof import("@/presentation/stores/authStore")>)
        )
      );
      logger.info("Critical modules preloaded");
    } catch (error) {
      logger.error("Failed to preload critical modules:", error);
    }
  };

  // Analyze bundle size
  public analyzeBundle = async (): Promise<BundleAnalysis> => {
    try {
      // In a real implementation, this would analyze the actual bundle
      // For now, we'll return mock data based on common patterns
      const analysis: BundleAnalysis = {
        totalSize: 0,
        chunkSizes: {},
        largestModules: [],
        compressionRatio: 0,
        recommendations: [],
      };

      // Simulate bundle analysis
      if (Platform.OS === "android") {
        analysis.totalSize = 1250; // 1.25MB
        analysis.chunkSizes = {
          main: 450,
          auth: 180,
          chat: 320,
          settings: 120,
          vendor: 180,
        };
      } else {
        analysis.totalSize = 980; // 980KB
        analysis.chunkSizes = {
          main: 380,
          auth: 150,
          chat: 280,
          settings: 90,
          vendor: 80,
        };
      }

      // Calculate largest modules
      const totalSize = analysis.totalSize;
      analysis.largestModules = Object.entries(analysis.chunkSizes)
        .map(([name, size]) => ({
          name,
          size,
          percentage: (size / totalSize) * 100,
        }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 5);

      // Calculate compression ratio
      analysis.compressionRatio = 0.65; // 35% compression

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      this.analysis = analysis;
      logger.info("Bundle analysis completed", "BundleOptimizer", analysis);

      return analysis;
    } catch (error) {
      logger.error("Bundle analysis failed:", error);
      throw error;
    }
  };

  private generateRecommendations = (analysis: BundleAnalysis): string[] => {
    const recommendations: string[] = [];

    // Check for oversized chunks
    Object.entries(analysis.chunkSizes).forEach(([name, size]) => {
      if (size > this.config.maxChunkSize) {
        recommendations.push(
          `Chunk '${name}' is ${size}KB (exceeds ${this.config.maxChunkSize}KB limit). Consider further splitting.`
        );
      }
    });

    // Check total bundle size
    const maxSizeKB = Platform.OS === "android" ? 2000 : 1500; // 2MB Android, 1.5MB iOS
    if (analysis.totalSize > maxSizeKB) {
      recommendations.push(
        `Total bundle size ${analysis.totalSize}KB exceeds recommended ${maxSizeKB}KB. Consider removing unused dependencies.`
      );
    }

    // Check compression
    if (analysis.compressionRatio > 0.8) {
      recommendations.push(
        "Bundle compression is inefficient. Consider enabling better compression algorithms."
      );
    }

    // Check for large modules
    const largeModules = analysis.largestModules.filter((m) => m.percentage > 20);
    if (largeModules.length > 0) {
      recommendations.push(
        `Large modules detected: ${largeModules.map((m) => m.name).join(", ")}. Consider code splitting.`
      );
    }

    // Platform-specific recommendations
    if (Platform.OS === "android") {
      recommendations.push("Consider enabling ProGuard/R8 for better Android bundle optimization.");
    } else {
      recommendations.push("Consider enabling bitcode for iOS App Store optimization.");
    }

    return recommendations;
  };

  // Optimize imports
  public optimizeImports = (filePath: string): string[] => {
    const recommendations: string[] = [];

    // This would analyze the file and suggest optimizations
    // For now, return general recommendations

    recommendations.push("Use dynamic imports for large libraries");
    recommendations.push("Remove unused imports");
    recommendations.push("Use specific imports instead of barrel imports");
    recommendations.push("Consider tree-shakable alternatives to heavy libraries");

    return recommendations;
  };

  // Get bundle optimization report
  public getOptimizationReport = (): string => {
    if (!this.analysis) {
      return "No bundle analysis available. Run analyzeBundle() first.";
    }

    const { totalSize, chunkSizes, largestModules, compressionRatio, recommendations } =
      this.analysis;

    return `
=== BUNDLE OPTIMIZATION REPORT ===
Total Size: ${totalSize}KB
Compression Ratio: ${(compressionRatio * 100).toFixed(1)}%

CHUNK SIZES:
${Object.entries(chunkSizes)
  .map(([name, size]) => `  ${name}: ${size}KB`)
  .join("\n")}

LARGEST MODULES:
${largestModules.map((m) => `  ${m.name}: ${m.size}KB (${m.percentage.toFixed(1)}%)`).join("\n")}

RECOMMENDATIONS:
${recommendations.map((r) => `  • ${r}`).join("\n")}

CONFIGURATION:
  Code Splitting: ${this.config.enableCodeSplitting ? "Enabled" : "Disabled"}
  Tree Shaking: ${this.config.enableTreeShaking ? "Enabled" : "Disabled"}
  Minification: ${this.config.enableMinification ? "Enabled" : "Disabled"}
  Max Chunk Size: ${this.config.maxChunkSize}KB
    `.trim();
  };

  // Validate bundle size against thresholds
  public validateBundleSize = (
    analysis: BundleAnalysis
  ): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } => {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check total size limits
    const maxSizeKB = Platform.OS === "android" ? 2000 : 1500;
    if (analysis.totalSize > maxSizeKB) {
      errors.push(`Bundle size ${analysis.totalSize}KB exceeds maximum ${maxSizeKB}KB`);
    } else if (analysis.totalSize > maxSizeKB * 0.8) {
      warnings.push(`Bundle size ${analysis.totalSize}KB is approaching limit ${maxSizeKB}KB`);
    }

    // Check chunk sizes
    Object.entries(analysis.chunkSizes).forEach(([name, size]) => {
      if (size > this.config.maxChunkSize) {
        errors.push(`Chunk '${name}' size ${size}KB exceeds maximum ${this.config.maxChunkSize}KB`);
      }
    });

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  };

  // Get current configuration
  public getConfig = (): BundleConfig => ({ ...this.config });

  // Update configuration
  public updateConfig = (updates: Partial<BundleConfig>): void => {
    this.config = { ...this.config, ...updates };
    logger.info("Bundle optimizer config updated", "BundleOptimizer", this.config);
  };
}

// Singleton instance
export const BundleOptimizer = new BundleOptimizerClass();

// React hooks
export const useBundleOptimizer = () => {
  const [analysis, setAnalysis] = React.useState<BundleAnalysis | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const analyzeBundle = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await BundleOptimizer.analyzeBundle();
      setAnalysis(result);
    } catch (error) {
      logger.error("Bundle analysis failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const lazyLoad = React.useCallback(<T>(importFn: () => Promise<T>) => {
    return BundleOptimizer.lazyLoad(importFn);
  }, []);

  return {
    analysis,
    isLoading,
    analyzeBundle,
    lazyLoad,
    config: BundleOptimizer.getConfig(),
    getReport: BundleOptimizer.getOptimizationReport,
    validate: BundleOptimizer.validateBundleSize,
  };
};

// Preloading utilities
export const preloadModules = async (): Promise<void> => {
  return BundleOptimizer.preloadCriticalModules();
};

// Bundle size monitoring
export const monitorBundleSize = (): void => {
  if (__DEV__) {
    // Monitor bundle size in development
    BundleOptimizer.analyzeBundle().then((analysis) => {
      const validation = BundleOptimizer.validateBundleSize(analysis);

      if (!validation.isValid) {
        console.warn("Bundle size validation failed:", validation.errors);
      }

      if (validation.warnings.length > 0) {
        console.warn("Bundle size warnings:", validation.warnings);
      }
    });
  }
};
