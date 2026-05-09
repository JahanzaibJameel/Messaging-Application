/**
 * Enterprise-grade Flashlight Performance Configuration
 * Automated FPS monitoring and performance regression testing
 */

module.exports = {
  // Flashlight configuration
  flashlight: {
    // Performance thresholds
    fps: {
      min: 55,      // Minimum acceptable FPS
      target: 60,   // Target FPS for smooth animations
      warning: 50,  // Warning threshold
      error: 40,    // Error threshold
    },
    
    // Memory thresholds
    memory: {
      warning: 150, // MB warning threshold
      error: 200,    // MB error threshold
    },
    
    // CPU thresholds
    cpu: {
      warning: 70,    // % CPU usage warning
      error: 85,      // % CPU usage error
    },
    
    // Network thresholds
    network: {
      latency: {
        warning: 200,  // ms warning threshold
        error: 500,    // ms error threshold
      },
      throughput: {
        warning: 100,   // KB/s warning threshold
        error: 50,     // KB/s error threshold
      },
    },
    
    // Bundle size thresholds
    bundle: {
      warning: 1.5,   // MB warning threshold
      error: 2.0,     // MB error threshold
    },
    
    // Animation performance
    animation: {
      frameTime: {
        warning: 16.67, // ms warning threshold (60fps = 16.67ms)
        error: 20,       // ms error threshold (50fps = 20ms)
      },
      droppedFrames: {
        warning: 5,  // % dropped frames warning
        error: 10,     // % dropped frames error
      },
    },
    
    // Test configuration
    test: {
      duration: 30000,  // 30 seconds per test
      iterations: 3,     // Run each test 3 times
      warmup: 2000,    // 2 second warmup
      cooldown: 1000,   // 1 second cooldown between tests
    },
    
    // Reporting configuration
    reporting: {
      // Output formats
      formats: ['json', 'html', 'junit'],
      
      // Metrics to collect
      metrics: [
        'fps',
        'memory',
        'cpu',
        'network',
        'bundle',
        'animation',
        'screen',
        'device',
      ],
      
      // Performance budgets
      budgets: [
        {
          name: 'Critical Path Performance',
          paths: ['login', 'chat', 'message'],
          thresholds: {
            fps: { min: 55, target: 58 },
            animation: { frameTime: { warning: 18, error: 22 } },
            loadTime: { warning: 1000, error: 2000 },
          },
        },
        {
          name: 'Memory Usage',
          thresholds: {
            memory: { warning: 120, error: 180 },
          },
        },
        {
          name: 'Network Performance',
          thresholds: {
            network: { 
              latency: { warning: 150, error: 300 },
              throughput: { warning: 80, error: 60 },
            },
          },
        },
      ],
      
      // Alert configuration
      alerts: {
        slack: {
          webhook: process.env.FLASHLIGHT_SLACK_WEBHOOK,
          channel: '#performance-alerts',
          mentionUsers: ['@performance-team'],
        },
        email: {
          recipients: ['dev-team@company.com'],
          subject: 'Performance Regression Alert',
        },
      },
      
      // Baseline comparison
      baseline: {
        enabled: true,
        branch: 'main',
        threshold: 5, // % regression threshold
        metrics: ['fps', 'memory', 'cpu', 'bundle'],
      },
    },
  },
  
  // Test scenarios
  scenarios: [
    {
      name: 'Message List Performance',
      description: 'Tests message list scrolling performance',
      setup: async () => {
        // Launch app and navigate to chat
        await device.launchApp();
        await element(by.id('chat-tab')).tap();
        await waitFor(element(by.id('message-list')).toBeVisible();
      },
      actions: [
        {
          name: 'Scroll to bottom',
          action: async () => {
            // Scroll through 100 messages
            await element(by.id('message-list')).scrollTo('bottom');
            await new Promise(resolve => setTimeout(resolve, 1000));
          },
        },
        {
          name: 'Rapid scroll',
          action: async () => {
            // Rapid scroll up and down
            for (let i = 0; i < 10; i++) {
              await element(by.id('message-list')).scrollTo(Math.random() * 100);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          },
        },
        {
          name: 'Memory stress test',
          action: async () => {
            // Open/close multiple chats to test memory
            for (let i = 0; i < 5; i++) {
              await element(by.id('chat-tab')).tap();
              await new Promise(resolve => setTimeout(resolve, 500));
              await device.pressBack();
            }
          },
        },
      ],
      metrics: ['fps', 'memory', 'cpu', 'animation'],
      timeout: 45000, // 45 seconds total
    },
    {
      name: 'Animation Performance',
      description: 'Tests UI thread animations',
      setup: async () => {
        await device.launchApp();
        await element(by.id('settings-tab')).tap();
        await element(by.id('animation-toggle')).tap();
      },
      actions: [
        {
          name: 'Toggle animations',
          action: async () => {
            await element(by.id('animation-toggle')).tap();
            await new Promise(resolve => setTimeout(resolve, 500));
          },
        },
        {
          name: 'Rapid animations',
          action: async () => {
            // Trigger multiple animations rapidly
            for (let i = 0; i < 5; i++) {
              await element(by.id('message-bubble')).tap();
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          },
        },
      ],
      metrics: ['fps', 'animation', 'cpu'],
      timeout: 20000, // 20 seconds total
    },
    {
      name: 'Bundle Performance',
      description: 'Tests app startup and bundle size',
      setup: async () => {
        // Cold start measurement
        const startTime = Date.now();
        await device.launchApp();
        const launchTime = Date.now() - startTime;
        
        // Measure initial bundle load
        await waitFor(element(by.id('home-screen')).toBeVisible();
        const loadTime = Date.now() - startTime;
        
        return { launchTime, loadTime };
      },
      actions: [
        {
          name: 'App startup',
          action: async () => {
            // Already measured in setup
            return { launchTime, loadTime };
          },
        },
      ],
      metrics: ['bundle', 'cpu', 'memory'],
      timeout: 15000, // 15 seconds total
    },
  ],
  
  // Device configuration
  device: {
    // Target devices for testing
    targets: [
      {
        platform: 'android',
        model: 'Pixel 6',
        version: '13',
        specs: {
          memory: '8GB',
          cpu: 'Snapdragon 8 Gen 1',
        },
      },
      {
        platform: 'ios',
        model: 'iPhone 14',
        version: '16.0',
        specs: {
          memory: '6GB',
          cpu: 'A15 Bionic',
        },
      },
    ],
    
    // Performance profiles
    profiles: {
      // Different performance testing profiles
      'low-end': {
        description: 'Low-end device testing',
        thresholds: {
          fps: { min: 30, target: 45, warning: 25, error: 20 },
          memory: { warning: 100, error: 150 },
          cpu: { warning: 60, error: 80 },
        },
      },
      'mid-range': {
        description: 'Mid-range device testing',
        thresholds: {
          fps: { min: 45, target: 55, warning: 45, error: 35 },
          memory: { warning: 150, error: 200 },
          cpu: { warning: 70, error: 85 },
        },
      },
      'high-end': {
        description: 'High-end device testing',
        thresholds: {
          fps: { min: 55, target: 60, warning: 50, error: 40 },
          memory: { warning: 200, error: 300 },
          cpu: { warning: 80, error: 95 },
        },
      },
    },
  },
  
  // Integration with CI/CD
  ci: {
    // GitHub Actions integration
    github: {
      enabled: true,
      artifactRetention: {
        reports: '30d', // Keep reports for 30 days
        videos: '7d',    // Keep videos for 7 days
        traces: '14d',   // Keep traces for 14 days
      },
      
      // PR comments
      comments: {
        enabled: true,
        template: '## Performance Metrics\n\n**FPS:** {fps} (Target: {target})\n**Memory:** {memory}MB\n**CPU:** {cpu}%\n\n{regression}',
      },
      
      // Status checks
      statusChecks: {
        enabled: true,
        contexts: ['performance-budget', 'regression-detection'],
      },
    },
    
    // Performance budgets
    budgets: {
      enabled: true,
      enforce: true,
      failOnThreshold: true,
    },
  },
  
  // Development settings
  development: {
    // Local development configuration
    debug: false,
    verbose: false,
    headless: false,
    record: false,
    
    // Local performance monitoring
    monitoring: {
      enabled: true,
      interval: 5000, // Monitor every 5 seconds
      thresholds: {
        fps: { warning: 52, error: 45 },
        memory: { warning: 180, error: 250 },
      },
    },
  },
};
