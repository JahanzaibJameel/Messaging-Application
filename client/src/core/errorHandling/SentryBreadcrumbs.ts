import * as Sentry from '@sentry/react-native';
import React, { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '@/presentation/stores/authStore';
import { useChatStore } from '@/presentation/stores/chatStore';
import { useMessageStore } from '@/presentation/stores/messageStore';
import { useUIStore } from '@/presentation/stores/uiStore';
// Simple logger fallback
const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  error: (message: string, error?: Error) => console.error(`[ERROR] ${message}`, error),
};

// Breadcrumb categories for better organization
export enum BreadcrumbCategory {
  USER_ACTION = 'user.action',
  NAVIGATION = 'navigation',
  NETWORK = 'network',
  ERROR = 'error',
  PERFORMANCE = 'performance',
  AUTH = 'auth',
  CHAT = 'chat',
  MESSAGE = 'message',
  SYNC = 'sync',
}

// Breadcrumb levels
export enum BreadcrumbLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  DEBUG = 'debug',
}

// Sentry context keys
export enum SentryContext {
  USER_ID = 'user_id',
  USER_EMAIL = 'user_email',
  APP_VERSION = 'app_version',
  DEVICE_INFO = 'device_info',
  STORE_STATE = 'store_state',
  FEATURE_FLAGS = 'feature_flags',
  NETWORK_STATUS = 'network_status',
}

/**
 * Sentry Breadcrumb Manager Hook
 * Automatically logs user actions and system events
 */
export const useSentryBreadcrumbs = () => {
  const { currentUser } = useAuthStore();
  const { getAllChats, getChatById } = useChatStore();
  const { getMessagesByChatId } = useMessageStore();
  const { showToast } = useUIStore();

  // Log navigation events
  const logNavigation = useCallback((to: string, from?: string) => {
    Sentry.addBreadcrumb({
      category: BreadcrumbCategory.NAVIGATION,
      message: `Navigated from ${from || 'unknown'} to ${to}`,
      level: BreadcrumbLevel.INFO,
      data: { to, from },
    });
  }, []);

  // Log user actions
  const logUserAction = useCallback((action: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      category: BreadcrumbCategory.USER_ACTION,
      message: `User action: ${action}`,
      level: BreadcrumbLevel.INFO,
      data: {
        user_id: currentUser?.id,
        action,
        ...data,
      },
    });
  }, [currentUser]);

  // Log network events
  const logNetworkEvent = useCallback((event: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      category: BreadcrumbCategory.NETWORK,
      message: `Network: ${event}`,
      level: BreadcrumbLevel.INFO,
      data,
    });
  }, []);

  // Log errors with context
  const logError = useCallback((error: Error, context?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      category: BreadcrumbCategory.ERROR,
      message: error.message || 'Unknown error',
      level: BreadcrumbLevel.ERROR,
      data: {
        error_name: error.name,
        error_stack: error.stack,
        ...context,
      },
    });
  }, []);

  // Log performance events
  const logPerformance = useCallback((metric: string, value: number, unit?: string) => {
    Sentry.addBreadcrumb({
      category: BreadcrumbCategory.PERFORMANCE,
      message: `Performance: ${metric}`,
      level: BreadcrumbLevel.INFO,
      data: { value, unit },
    });
  }, []);

  // Set Sentry context with user information
  const setUserContext = useCallback(() => {
    if (currentUser) {
      Sentry.setContext(SentryContext.USER_ID, currentUser.id);
      Sentry.setContext(SentryContext.USER_EMAIL, currentUser.email || '');
      Sentry.setContext(SentryContext.APP_VERSION, '3.0.0');
      
      // Device info
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        model: Platform.constants?.Model || 'Unknown',
      };
      
      Sentry.setContext(SentryContext.DEVICE_INFO, deviceInfo);
    }
  }, [currentUser]);

  // Set store state context for debugging
  const setStoreContext = useCallback(() => {
    try {
      const storeState = {
        auth: {
          currentUser: currentUser?.id,
          isAuthenticated: !!currentUser,
        },
        chat: {
          totalChats: getAllChats().length,
          activeChatId: null, // This would be set by the current screen
        },
        messages: {
          totalMessages: Object.values(getMessagesByChatId())
            .reduce((total, messages) => total + messages.length, 0),
        },
        ui: {
          lastToast: null, // This would track the last toast shown
        },
      };

      Sentry.setContext(SentryContext.STORE_STATE, storeState);
    } catch (error) {
      logger.error('Failed to set store context:', error);
    }
  }, [currentUser, getAllChats, getChatById, getMessagesByChatId]);

  // Set feature flags context
  const setFeatureFlagsContext = useCallback(() => {
    // This would be populated from your feature flags system
    const featureFlags = {
      flashlist_optimization: true, // From feature flag system
      ui_thread_animations: false, // Controlled by feature flag
      performance_monitoring: true,
    };

    Sentry.setContext(SentryContext.FEATURE_FLAGS, featureFlags);
  }, []);

  // Set network status context
  const setNetworkContext = useCallback((isOnline: boolean, connectionType?: string) => {
    Sentry.setContext(SentryContext.NETWORK_STATUS, {
      is_online: isOnline,
      connection_type: connectionType || 'unknown',
    });
  }, []);

  return {
    // Navigation logging
    logNavigation,
    
    // User action logging
    logUserAction,
    
    // Network event logging
    logNetworkEvent,
    
    // Error logging with context
    logError,
    
    // Performance logging
    logPerformance,
    
    // Context setters
    setUserContext,
    setStoreContext,
    setFeatureFlagsContext,
    setNetworkContext,
  };
};

/**
 * Enhanced Error Boundary with Sentry Integration
 * Captures errors and provides rich context
 */
export interface SentryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  onError?: (error: Error, errorInfo: any) => void;
}

export const SentryErrorBoundary: React.FC<SentryErrorBoundaryProps> = ({
  children,
  fallback,
  onError,
}) => {
  const { logError, setStoreContext } = useSentryBreadcrumbs();

  const handleError = useCallback((error: Error, errorInfo: any) => {
    // Log the error with full context
    logError(error, {
      component_stack: errorInfo?.componentStack,
      react_component_name: errorInfo?.componentName,
      error_boundary: true,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Capture the exception in Sentry
    Sentry.captureException(error, {
      contexts: [
        {
          category: 'error_boundary',
          data: {
            error_boundary: true,
            fallback_rendered: !!fallback,
          },
        },
      ],
      tags: {
        error_boundary: true,
      },
    });
  }, [logError, onError]);

  return (
    <Sentry.ErrorBoundary
      fallback={fallback}
      onError={handleError}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

SentryErrorBoundary.displayName = 'SentryErrorBoundary';

/**
 * Automatic Action Logger
 * Higher-order component that automatically logs user interactions
 */
export const withSentryLogging = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const WithSentryLogging = React.forwardRef<any, P>((props, ref) => {
    const { logUserAction } = useSentryBreadcrumbs();

    const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name;
    const displayName = `withSentryLogging(${wrappedComponentName})`;

    // Enhanced event handler that logs actions
    const createLoggedHandler = (eventName: string) => {
      return (event: any, ...args: any[]) => {
        // Log the user action
        logUserAction(`${wrappedComponentName}.${eventName}`, {
          props: Object.keys(props),
          args,
        });

        // Call the original handler
        const handler = (props as any)[eventName];
        if (handler && typeof handler === 'function') {
          return handler(event, ...args);
        }
      };
    };

    // Create wrapped component props with logged handlers
    const loggedProps: any = {};
    
    // Common interactive events to log
    const interactiveEvents = [
      'onPress', 'onLongPress', 'onPressIn', 'onPressOut',
      'onLayout', 'onScroll', 'onScrollBeginDrag', 'onScrollEndDrag',
      'onMomentumScrollBegin', 'onMomentumScrollEnd',
      'onChangeText', 'onFocus', 'onBlur', 'onSubmit', 'onReset',
    ];

    // Wrap interactive event handlers
    interactiveEvents.forEach(eventName => {
      if (eventName in (WrappedComponent as any).prototype) {
        loggedProps[eventName] = createLoggedHandler(eventName);
      }
    });

    return (
      <WrappedComponent ref={ref} {...props} {...loggedProps} />
    );
  });

  WithSentryLogging.displayName = displayName;

  return WithSentryLogging;
};

/**
 * Performance Monitoring Hook
 * Tracks app performance and reports to Sentry
 */
export const usePerformanceMonitoring = () => {
  const { logPerformance, logNetworkEvent } = useSentryBreadcrumbs();

  // Track app startup time
  React.useEffect(() => {
    const startTime = Date.now();
    
    // Measure time to first interaction
    const measureStartup = () => {
      const loadTime = Date.now() - startTime;
      logPerformance('app_startup_time', loadTime, 'ms');
    };

    // Measure after 2 seconds (typical app load time)
    const timer = setTimeout(measureStartup, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Track memory usage
  const trackMemoryUsage = useCallback(() => {
    try {
      // In React Native, we can use the Performance API if available
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        logPerformance('memory_usage', memory.usedJSHeapSize, 'bytes');
      }
    } catch (error) {
      logger.warn('Memory monitoring not available:', error);
    }
  }, []);

  // Track FPS
  const trackFPS = useCallback(() => {
    let frameCount = 0;
    let lastTime = Date.now();

    const measureFrame = () => {
      frameCount++;
      const now = Date.now();
      const delta = now - lastTime;
      const fps = Math.round(1000 / delta);
      
      // Log FPS every 60 frames (approximately 1 second)
      if (frameCount % 60 === 0) {
        logPerformance('fps', fps, 'fps');
        
        // Report low FPS to Sentry
        if (fps < 55) {
          Sentry.captureMessage('Low FPS detected', {
            level: 'warning',
            extra: { fps, delta },
          });
        }
      }
      
      lastTime = now;
    };

    // This would typically be called from an animation loop
    return measureFrame;
  }, []);

  return {
    trackMemoryUsage,
    trackFPS,
  };
};

/**
 * Network Request Interceptor
 * Logs all network requests for debugging
 */
export const setupNetworkMonitoring = () => {
  const { logNetworkEvent, logError } = useSentryBreadcrumbs();

  // This would integrate with your HTTP client
  const originalFetch = global.fetch;
  
  global.fetch = async (...args) => {
    const [url, options] = args;
    const startTime = Date.now();
    
    try {
      logNetworkEvent('fetch_start', { url, method: options?.method });
      
      const response = await originalFetch(...args);
      
      const duration = Date.now() - startTime;
      logNetworkEvent('fetch_complete', { 
        url, 
        method: options?.method,
        status: response.status,
        duration,
      });
      
      return response;
    } catch (error) {
      logNetworkEvent('fetch_error', { url, method: options?.method, error: error.message });
      logError(error, { url, method: options?.method });
      throw error;
    }
  };
};

export default {
  BreadcrumbCategory,
  BreadcrumbLevel,
  SentryContext,
  useSentryBreadcrumbs,
  SentryErrorBoundary,
  withSentryLogging,
  usePerformanceMonitoring,
  setupNetworkMonitoring,
};
