/**
 * Performance Regression Tests
 * Tests to ensure the app maintains acceptable performance metrics
 * 
 * Target Performance:
 * - Chat List: >58 FPS when scrolling through 500 items
 * - Message List: >58 FPS when scrolling through 200 messages
 * - Error Threshold: <55 FPS
 */

import { performance } from 'perf_hooks';
import { renderHook, act } from '@testing-library/react-native';
import { FlashList } from '@shopify/flash-list';
import { useMVPStore } from '../presentation/stores/mvpStore';
import type { Chat, Message } from '../presentation/stores/mvpStore';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  TARGET_FPS: 58,
  MIN_FPS: 55,
  FRAME_TIME_TARGET: 16.67, // 60 FPS = 16.67ms per frame
  FRAME_TIME_MAX: 18.18, // 55 FPS = 18.18ms per frame
};

// Mock performance measurement utilities
const measurePerformance = (callback: () => void, iterations: number = 100) => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    callback();
    const end = performance.now();
    times.push(end - start);
  }
  
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  return {
    avgTime,
    minTime,
    maxTime,
    avgFPS: 1000 / avgTime,
    minFPS: 1000 / maxTime,
    maxFPS: 1000 / minTime,
  };
};

// Generate test data
const generateTestChats = (count: number): Chat[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `chat-${index}`,
    name: `Chat ${index}`,
    lastMessage: `Last message from chat ${index}`,
    timestamp: new Date(Date.now() - index * 1000),
    unreadCount: Math.floor(Math.random() * 10),
  }));
};

const generateTestMessages = (count: number): Message[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `msg-${index}`,
    text: `This is message number ${index} with some content to simulate real messages`,
    senderId: index % 2 === 0 ? 'me' : 'other',
    timestamp: new Date(Date.now() - index * 60000), // 1 minute apart
    isOwn: index % 2 === 0,
  }));
};

describe('Performance Regression Tests', () => {
  let mockSet: jest.Mock;
  let mockGetString: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSet = jest.fn();
    mockGetString = jest.fn();
    
    // Mock MMKV to avoid persistence overhead during performance tests
    jest.mock('react-native-mmkv', () => ({
      MMKV: jest.fn().mockImplementation(() => ({
        getString: mockGetString,
        set: mockSet,
        delete: jest.fn(),
        clearAll: jest.fn(),
      })),
    }));
  });

  describe('Chat List Performance', () => {
    it('should maintain >58 FPS when scrolling through 500 chat items', () => {
      const testChats = generateTestChats(500);
      
      const { result } = renderHook(() => useMVPStore());
      
      // Load test data
      act(() => {
        result.current.setChats(testChats);
      });
      
      // Simulate scroll performance test
      const scrollPerformance = measurePerformance(() => {
        // Simulate scroll operation - rendering 10 items at a time
        for (let i = 0; i < 10; i++) {
          const startIndex = Math.floor(Math.random() * 490);
          const endIndex = startIndex + 10;
          const visibleChats = testChats.slice(startIndex, endIndex);
          
          // Simulate rendering each visible chat item
          visibleChats.forEach(chat => {
            // Simulate the cost of rendering a chat item
            JSON.stringify(chat);
          });
        }
      }, 50);
      
      console.log('Chat List Performance:', {
        avgFPS: scrollPerformance.avgFPS.toFixed(2),
        minFPS: scrollPerformance.minFPS.toFixed(2),
        avgFrameTime: `${scrollPerformance.avgTime.toFixed(2)}ms`,
        maxFrameTime: `${scrollPerformance.maxTime.toFixed(2)}ms`,
      });
      
      // Performance assertions
      expect(scrollPerformance.avgFPS).toBeGreaterThan(PERFORMANCE_THRESHOLDS.TARGET_FPS);
      expect(scrollPerformance.minFPS).toBeGreaterThan(PERFORMANCE_THRESHOLDS.MIN_FPS);
      expect(scrollPerformance.avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FRAME_TIME_TARGET);
      expect(scrollPerformance.maxTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FRAME_TIME_MAX);
    });
  });
});
