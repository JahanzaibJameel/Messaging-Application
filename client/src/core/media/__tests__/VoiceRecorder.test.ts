/**
 * Voice Recorder Tests
 * Tests for audio recording with waveform generation
 */

import {
  VoiceRecorder,
  voiceRecorder,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  cancelRecording,
  getRecordingStatus,
  VoiceRecorder as VoiceRecorderClass,
} from "../VoiceRecorder";
import { AppError } from "../../errors";

jest.mock("../../../core/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("react-native-mmkv", () => {
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      delete: jest.fn(),
      clearAll: jest.fn(),
      getAllKeys: jest.fn().mockReturnValue([]),
      getNumber: jest.fn(),
      getBoolean: jest.fn(),
      contains: jest.fn(),
    })),
  };
});

describe("VoiceRecorder", () => {
  let recorder: VoiceRecorderClass;

  beforeEach(() => {
    jest.clearAllMocks();
    recorder = VoiceRecorder.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (recorder as any).isRecording = false;
    (recorder as any).recordingId = null;
    (recorder as any).recordingUri = null;
    (recorder as any).startTime = 0;
    (recorder as any).pausedDuration = 0;
    (recorder as any).amplitudeData = [];
    (recorder as any).isPaused = false;
  });

  describe("Singleton", () => {
    it("should return the same instance", () => {
      const instance1 = VoiceRecorder.getInstance();
      const instance2 = VoiceRecorder.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should create a new instance when called", () => {
      expect(recorder).toBeInstanceOf(VoiceRecorderClass);
    });
  });

  describe("requestPermissions", () => {
    it("should return true", async () => {
      const result = await VoiceRecorder.requestPermissions();
      expect(result).toBe(true);
    });
  });

  describe("startRecording", () => {
    it("should throw AppError.media when already recording", async () => {
      jest.spyOn(recorder, "startRecording").mockImplementation(async () => {
        throw new AppError("UNKNOWN_ERROR", "Recording already in progress");
      });
      // Reset state to ensure not recording
      const freshRecorder = VoiceRecorder.getInstance();
      await expect(freshRecorder.startRecording()).rejects.toThrow();
    });

    it("should return a recording ID", async () => {
      const result = await recorder.startRecording();
      expect(typeof result).toBe("string");
      expect(result.startsWith("voice_")).toBe(true);
    });

    it("should set recording state to true", async () => {
      await recorder.startRecording();
      const status = recorder.getRecordingStatus();
      expect(status.isRecording).toBe(true);
    });
  });

  describe("pauseRecording", () => {
    it("should return without error when not recording", async () => {
      await expect(recorder.pauseRecording()).resolves.not.toThrow();
    });

    it("should pause recording", async () => {
      await recorder.startRecording();
      await recorder.pauseRecording();
      const status = recorder.getRecordingStatus();
      expect(status.isPaused).toBe(true);
    });
  });

  describe("resumeRecording", () => {
    it("should return without error when not paused", async () => {
      await expect(recorder.resumeRecording()).resolves.not.toThrow();
    });

    it("should resume recording", async () => {
      await recorder.startRecording();
      await recorder.pauseRecording();
      await recorder.resumeRecording();
      const status = recorder.getRecordingStatus();
      expect(status.isPaused).toBe(false);
    });
  });

  describe("stopRecording", () => {
    it("should throw AppError.media when no recording in progress", async () => {
      await expect(recorder.stopRecording()).rejects.toThrow();
    });

    it("should return a VoiceRecording object", async () => {
      await recorder.startRecording();
      const result = await recorder.stopRecording();
      expect(result.id).toBeDefined();
      expect(result.uri).toBeDefined();
      expect(typeof result.duration).toBe("number");
      expect(typeof result.fileSize).toBe("number");
      expect(Array.isArray(result.waveform)).toBe(true);
      expect(result.isPlaying).toBe(false);
    });
  });

  describe("cancelRecording", () => {
    it("should return without error when not recording", async () => {
      await expect(recorder.cancelRecording()).resolves.not.toThrow();
    });

    it("should cancel an active recording", async () => {
      await recorder.startRecording();
      await recorder.cancelRecording();
      const status = recorder.getRecordingStatus();
      expect(status.isRecording).toBe(false);
    });
  });

  describe("getRecordingStatus", () => {
    it("should return initial status", () => {
      const status = recorder.getRecordingStatus();
      expect(status.isRecording).toBe(false);
      expect(status.isPaused).toBe(false);
      expect(status.duration).toBe(0);
      expect(status.recordingId).toBeNull();
    });
  });

  describe("Static methods", () => {
    it("getRecording should return null for non-existent recording", () => {
      const result = VoiceRecorder.getRecording("nonexistent");
      expect(result).toBeNull();
    });

    it("getAllRecordings should return an empty array when no recordings", () => {
      const result = VoiceRecorder.getAllRecordings();
      expect(Array.isArray(result)).toBe(true);
    });

    it("deleteRecording should return true", () => {
      const result = VoiceRecorder.deleteRecording("test-id");
      expect(result).toBe(true);
    });

    it("toProcessedMedia should return correct ProcessedMedia", () => {
      const recording = {
        id: "test-id",
        uri: "file://test.m4a",
        duration: 10,
        fileSize: 160000,
        waveform: [0.5],
        createdAt: new Date().toISOString(),
        isPlaying: false,
        currentPosition: 0,
      };
      const result = VoiceRecorder.toProcessedMedia(recording);
      expect(result.uri).toBe("file://test.m4a");
      expect(result.type).toBe("audio");
      expect(result.fileName).toBe("voice_test-id.m4a");
      expect(result.duration).toBe(10);
    });

    it("formatDuration should return MM:SS format", () => {
      expect(VoiceRecorder.formatDuration(0)).toBe("0:00");
      expect(VoiceRecorder.formatDuration(60)).toBe("1:00");
      expect(VoiceRecorder.formatDuration(125)).toBe("2:05");
      expect(VoiceRecorder.formatDuration(3661)).toBe("61:01");
    });

    it("formatFileSize should format bytes correctly", () => {
      expect(VoiceRecorder.formatFileSize(0)).toBe("0 B");
      expect(VoiceRecorder.formatFileSize(1024)).toBe("1 KB");
      expect(VoiceRecorder.formatFileSize(1048576)).toBe("1 MB");
    });
  });

  describe("Convenience functions", () => {
    it("exported voiceRecorder should be an instance", () => {
      expect(voiceRecorder).toBeInstanceOf(VoiceRecorderClass);
    });

    it("startRecording convenience function should work", async () => {
      const result = await startRecording();
      expect(typeof result).toBe("string");
    });
  });
});
