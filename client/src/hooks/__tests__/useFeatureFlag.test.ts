/**
 * Feature Flag Hooks Tests
 * Tests for useFeatureFlag and useFeatureFlags hooks
 */

import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useFeatureFlag, useFeatureFlags, useFeatureFlagActions, useFeatureFlagsLoading } from '../useFeatureFlag';
import { useFeatureFlagsStore } from '../../stores/featureFlagsStore';

// Mock the store
jest.mock('../../stores/featureFlagsStore', () => ({
  useFeatureFlagsStore: jest.fn(),
}));

const mockUseFeatureFlagsStore = useFeatureFlagsStore as jest.MockedFunction<any>;

describe('Feature Flag Hooks', () => {
  const mockStore = {
    isFlagEnabled: jest.fn(),
    getAllFlags: jest.fn(),
    setFlag: jest.fn(),
    setOverride: jest.fn(),
    resetOverrides: jest.fn(),
    resetToDefaults: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockUseFeatureFlagsStore as jest.Mock).mockReturnValue(mockStore);
  });

  describe('useFeatureFlag', () => {
    it('should return flag enabled status', () => {
      mockStore.isFlagEnabled.mockReturnValue(true);

      const { result } = renderHook(() => useFeatureFlag('enableVoiceMessages'));

      expect(result.current).toBe(true);
      expect(mockStore.isFlagEnabled).toHaveBeenCalledWith('enableVoiceMessages');
    });

    it('should return flag disabled status', () => {
      mockStore.isFlagEnabled.mockReturnValue(false);

      const { result } = renderHook(() => useFeatureFlag('enableVoiceMessages'));

      expect(result.current).toBe(false);
      expect(mockStore.isFlagEnabled).toHaveBeenCalledWith('enableVoiceMessages');
    });

    it('should update when flag status changes', () => {
      mockStore.isFlagEnabled.mockReturnValue(false);

      const { result, rerender } = renderHook(() => useFeatureFlag('enableVoiceMessages'));

      expect(result.current).toBe(false);

      // Simulate flag change
      mockStore.isFlagEnabled.mockReturnValue(true);
      rerender();

      expect(result.current).toBe(true);
    });

    it('should handle different flag keys', () => {
      mockStore.isFlagEnabled.mockImplementation((flag) => flag === 'enableDarkMode');

      const { result: darkResult } = renderHook(() => useFeatureFlag('enableDarkMode'));
      const { result: voiceResult } = renderHook(() => useFeatureFlag('enableVoiceMessages'));

      expect(darkResult.current).toBe(true);
      expect(voiceResult.current).toBe(false);
    });
  });

  describe('useFeatureFlags', () => {
    it('should return all flags', () => {
      const mockFlags = {
        enableVoiceMessages: false,
        enableDarkMode: true,
        enableReadReceipts: true,
      };
      mockStore.getAllFlags.mockReturnValue(mockFlags);

      const { result } = renderHook(() => useFeatureFlags());

      expect(result.current).toEqual(mockFlags);
      expect(mockStore.getAllFlags).toHaveBeenCalled();
    });

    it('should update when flags change', () => {
      const initialFlags = {
        enableVoiceMessages: false,
        enableDarkMode: true,
      };
      const updatedFlags = {
        enableVoiceMessages: true,
        enableDarkMode: false,
      };

      mockStore.getAllFlags.mockReturnValue(initialFlags);

      const { result, rerender } = renderHook(() => useFeatureFlags());

      expect(result.current).toEqual(initialFlags);

      // Simulate flags change
      mockStore.getAllFlags.mockReturnValue(updatedFlags);
      rerender();

      expect(result.current).toEqual(updatedFlags);
    });

    it('should return empty object when no flags', () => {
      mockStore.getAllFlags.mockReturnValue({});

      const { result } = renderHook(() => useFeatureFlags());

      expect(result.current).toEqual({});
    });
  });

  describe('useFeatureFlagActions', () => {
    it('should return all action functions', () => {
      const { result } = renderHook(() => useFeatureFlagActions());

      expect(result.current).toEqual({
        setFlag: mockStore.setFlag,
        setOverride: mockStore.setOverride,
        resetOverrides: mockStore.resetOverrides,
        resetToDefaults: mockStore.resetToDefaults,
      });
    });

    it('should call setFlag when invoked', () => {
      const { result } = renderHook(() => useFeatureFlagActions());

      act(() => {
        result.current.setFlag('enableVoiceMessages', true);
      });

      expect(mockStore.setFlag).toHaveBeenCalledWith('enableVoiceMessages', true);
    });

    it('should call setOverride when invoked', () => {
      const { result } = renderHook(() => useFeatureFlagActions());

      act(() => {
        result.current.setOverride('enableVoiceMessages', false);
      });

      expect(mockStore.setOverride).toHaveBeenCalledWith('enableVoiceMessages', false);
    });

    it('should call resetOverrides when invoked', () => {
      const { result } = renderHook(() => useFeatureFlagActions());

      act(() => {
        result.current.resetOverrides();
      });

      expect(mockStore.resetOverrides).toHaveBeenCalled();
    });

    it('should call resetToDefaults when invoked', () => {
      const { result } = renderHook(() => useFeatureFlagActions());

      act(() => {
        result.current.resetToDefaults();
      });

      expect(mockStore.resetToDefaults).toHaveBeenCalled();
    });

    it('should handle multiple actions in sequence', () => {
      const { result } = renderHook(() => useFeatureFlagActions());

      act(() => {
        result.current.setFlag('enableVoiceMessages', true);
        result.current.setOverride('enableDarkMode', false);
        result.current.setFlag('enableReadReceipts', true);
      });

      expect(mockStore.setFlag).toHaveBeenCalledTimes(2);
      expect(mockStore.setOverride).toHaveBeenCalledTimes(1);
      expect(mockStore.setFlag).toHaveBeenCalledWith('enableVoiceMessages', true);
      expect(mockStore.setOverride).toHaveBeenCalledWith('enableDarkMode', false);
      expect(mockStore.setFlag).toHaveBeenCalledWith('enableReadReceipts', true);
    });
  });

  describe('useFeatureFlagsLoading', () => {
    it('should return loading state', () => {
      mockStore.isLoading = false;

      const { result } = renderHook(() => useFeatureFlagsLoading());

      expect(result.current).toBe(false);
    });

    it('should return true when loading', () => {
      mockStore.isLoading = true;

      const { result } = renderHook(() => useFeatureFlagsLoading());

      expect(result.current).toBe(true);
    });

    it('should update when loading state changes', () => {
      mockStore.isLoading = false;

      const { result, rerender } = renderHook(() => useFeatureFlagsLoading());

      expect(result.current).toBe(false);

      // Simulate loading state change
      mockStore.isLoading = true;
      rerender();

      expect(result.current).toBe(true);
    });
  });

  describe('Hook Integration', () => {
    it('should work together with multiple hooks', () => {
      mockStore.isFlagEnabled.mockImplementation((flag) => flag === 'enableDarkMode');
      mockStore.getAllFlags.mockReturnValue({
        enableVoiceMessages: false,
        enableDarkMode: true,
        enableReadReceipts: true,
      });
      mockStore.isLoading = false;

      const { result: flagResult } = renderHook(() => useFeatureFlag('enableDarkMode'));
      const { result: flagsResult } = renderHook(() => useFeatureFlags());
      const { result: loadingResult } = renderHook(() => useFeatureFlagsLoading());

      expect(flagResult.current).toBe(true);
      expect(flagsResult.current).toEqual({
        enableVoiceMessages: false,
        enableDarkMode: true,
        enableReadReceipts: true,
      });
      expect(loadingResult.current).toBe(false);
    });

    it('should handle store errors gracefully', () => {
      mockStore.isFlagEnabled.mockImplementation(() => {
        throw new Error('Store error');
      });

      expect(() => {
        renderHook(() => useFeatureFlag('enableVoiceMessages'));
      }).toThrow('Store error');
    });
  });

  describe('Performance', () => {
    it('should handle rapid hook calls', () => {
      mockStore.isFlagEnabled.mockReturnValue(true);

      const { result } = renderHook(() => useFeatureFlag('enableVoiceMessages'));

      // Rapid calls
      for (let i = 0; i < 100; i++) {
        expect(result.current).toBe(true);
      }

      expect(mockStore.isFlagEnabled).toHaveBeenCalledTimes(100);
    });

    it('should handle multiple instances of same hook', () => {
      mockStore.isFlagEnabled.mockReturnValue(true);

      const hooks = Array.from({ length: 10 }, () => 
        renderHook(() => useFeatureFlag('enableVoiceMessages'))
      );

      hooks.forEach(({ result }) => {
        expect(result.current).toBe(true);
      });

      expect(mockStore.isFlagEnabled).toHaveBeenCalledTimes(10);
    });

    it('should handle different flag keys efficiently', () => {
      mockStore.isFlagEnabled.mockImplementation((flag) => flag.includes('Voice'));

      const { result: voiceResult } = renderHook(() => useFeatureFlag('enableVoiceMessages'));
      const { result: darkResult } = renderHook(() => useFeatureFlag('enableDarkMode'));
      const { result: receiptResult } = renderHook(() => useFeatureFlag('enableReadReceipts'));

      expect(voiceResult.current).toBe(true);
      expect(darkResult.current).toBe(false);
      expect(receiptResult.current).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should accept string flag keys', () => {
      mockStore.isFlagEnabled.mockReturnValue(true);

      expect(() => {
        renderHook(() => useFeatureFlag('enableVoiceMessages'));
      }).not.toThrow();
    });

    it('should handle dynamic flag keys', () => {
      mockStore.isFlagEnabled.mockReturnValue(true);

      const flagKey = 'enableVoiceMessages';

      const { result } = renderHook(() => useFeatureFlag(flagKey));

      expect(result.current).toBe(true);
      expect(mockStore.isFlagEnabled).toHaveBeenCalledWith(flagKey);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should simulate enabling a feature flag', () => {
      mockStore.isFlagEnabled.mockReturnValue(false);
      mockStore.setFlag.mockImplementation(() => {
        mockStore.isFlagEnabled.mockReturnValue(true);
      });

      const { result: flagResult } = renderHook(() => useFeatureFlag('enableVoiceMessages'));
      const { result: actionsResult } = renderHook(() => useFeatureFlagActions());

      // Initially disabled
      expect(flagResult.current).toBe(false);

      // Enable flag
      act(() => {
        actionsResult.current.setFlag('enableVoiceMessages', true);
      });

      // Should be enabled
      expect(mockStore.setFlag).toHaveBeenCalledWith('enableVoiceMessages', true);
    });

    it('should simulate developer override', () => {
      mockStore.isFlagEnabled.mockReturnValue(false);
      mockStore.setOverride.mockImplementation(() => {
        mockStore.isFlagEnabled.mockReturnValue(true);
      });

      const { result: flagResult } = renderHook(() => useFeatureFlag('enableVoiceMessages'));
      const { result: actionsResult } = renderHook(() => useFeatureFlagActions());

      // Initially disabled
      expect(flagResult.current).toBe(false);

      // Set override
      act(() => {
        actionsResult.current.setOverride('enableVoiceMessages', true);
      });

      // Should be enabled due to override
      expect(mockStore.setOverride).toHaveBeenCalledWith('enableVoiceMessages', true);
    });

    it('should simulate resetting overrides', () => {
      mockStore.isFlagEnabled.mockReturnValue(true); // Due to override
      mockStore.resetOverrides.mockImplementation(() => {
        mockStore.isFlagEnabled.mockReturnValue(false); // Back to default
      });

      const { result: flagResult } = renderHook(() => useFeatureFlag('enableVoiceMessages'));
      const { result: actionsResult } = renderHook(() => useFeatureFlagActions());

      // Initially enabled due to override
      expect(flagResult.current).toBe(true);

      // Reset overrides
      act(() => {
        actionsResult.current.resetOverrides();
      });

      // Should be back to default
      expect(mockStore.resetOverrides).toHaveBeenCalled();
    });
  });
});
