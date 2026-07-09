/**
 * Voice Recorder
 * Handles audio recording with waveform generation and compression
 */

import { AppError } from "../errors";
import { logger } from "../logger";
import { MMKV } from "react-native-mmkv";
import type { ProcessedMedia } from "./MediaProcessor";

export interface VoiceRecording {
  id: string;
  uri: string;
  duration: number; // in seconds
  fileSize: number;
  waveform: number[]; // amplitude data for visualization
  createdAt: string;
  isPlaying: boolean;
  currentPosition: number;
}

export interface RecordingOptions {
  maxDuration?: number; // in seconds
  quality?: "low" | "medium" | "high";
  format?: "m4a" | "wav" | "mp3";
}

const DEFAULT_OPTIONS: RecordingOptions = {
  maxDuration: 60, // 1 minute
  quality: "medium",
  format: "m4a",
};

const storage = new MMKV({ id: "voice_recordings" });

export class VoiceRecorder {
  private static instance: VoiceRecorder;
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private recordingId: string | null = null;
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private recordingUri: string | null = null;
  private amplitudeData: number[] = [];
  private amplitudeTimer: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  static getInstance(): VoiceRecorder {
    if (!VoiceRecorder.instance) {
      VoiceRecorder.instance = new VoiceRecorder();
    }
    return VoiceRecorder.instance;
  }

  /**
   * Request recording permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      // Note: expo-av needs to be installed
      // const { status } = await Audio.requestPermissionsAsync();
      // return status === 'granted';

      // For now, return true (will be implemented with expo-av)
      return true;
    } catch (error) {
      logger.error("Recording permission error", error as Error, "VoiceRecorder");
      return false;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(options: RecordingOptions = {}): Promise<string> {
    if (this.isRecording) {
      throw AppError.media("Recording already in progress");
    }

    const hasPermission = await VoiceRecorder.requestPermissions();
    if (!hasPermission) {
      throw AppError.permission("Microphone permission not granted");
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.recordingId = this.generateRecordingId();
    this.startTime = Date.now();
    this.pausedDuration = 0;
    this.amplitudeData = [];

    try {
      // Note: This would be implemented with expo-av
      // const { recording } = await Audio.Recording.createAsync(
      //   Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      // );

      // For now, simulate recording
      this.isRecording = true;
      this.isPaused = false;
      this.startAmplitudeMonitoring();

      // Store recording metadata
      const metadata = {
        id: this.recordingId,
        startTime: this.startTime,
        options: opts,
        status: "recording",
      };

      storage.set(`recording_${this.recordingId}`, JSON.stringify(metadata));

      logger.info(`Recording started - ID: ${this.recordingId}`, "VoiceRecorder");
      return this.recordingId!;
    } catch (error) {
      this.cleanup();
      throw AppError.media("Failed to start recording", error as Error);
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording(): Promise<void> {
    if (!this.isRecording || this.isPaused) {
      return;
    }

    try {
      this.isPaused = true;
      this.pausedDuration = Date.now() - this.startTime;
      this.stopAmplitudeMonitoring();

      // Note: Would pause the actual recording with expo-av
      // await this.recording?.pauseAsync();

      logger.info(`Recording paused - ID: ${this.recordingId}`, "VoiceRecorder");
    } catch (error) {
      throw AppError.media("Failed to pause recording", error as Error);
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording(): Promise<void> {
    if (!this.isRecording || !this.isPaused) {
      return;
    }

    try {
      this.isPaused = false;
      this.startTime = Date.now() - this.pausedDuration;
      this.startAmplitudeMonitoring();

      // Note: Would resume the actual recording with expo-av
      // await this.recording?.startAsync();

      logger.info(`Recording resumed - ID: ${this.recordingId}`, "VoiceRecorder");
    } catch (error) {
      throw AppError.media("Failed to resume recording", error as Error);
    }
  }

  /**
   * Stop recording and return the processed audio
   */
  async stopRecording(): Promise<VoiceRecording> {
    if (!this.isRecording || !this.recordingId) {
      throw AppError.media("No recording in progress");
    }

    try {
      this.isRecording = false;
      this.isPaused = false;
      this.stopAmplitudeMonitoring();

      const endTime = Date.now();
      const totalDuration = (endTime - this.startTime) / 1000; // Convert to seconds

      // Note: Would stop the actual recording with expo-av
      // const uri = this.recording?.getURI();
      // await this.recording?.stopAndUnloadAsync();

      // For now, simulate the recording URI
      const uri = `file://voice_recording_${this.recordingId}.m4a`;
      this.recordingUri = uri;

      // Simulate file size calculation (would be actual file size)
      const fileSize = Math.floor(totalDuration * 16000); // Rough estimate: 16KB per second

      const voiceRecording: VoiceRecording = {
        id: this.recordingId,
        uri,
        duration: totalDuration,
        fileSize,
        waveform: this.amplitudeData,
        createdAt: new Date().toISOString(),
        isPlaying: false,
        currentPosition: 0,
      };

      // Store the recording metadata
      storage.set(`voice_${this.recordingId}`, JSON.stringify(voiceRecording));

      // Clean up recording state
      this.cleanup();

      logger.info(
        `Recording completed - ID: ${this.recordingId}, Duration: ${totalDuration}s, Size: ${fileSize}B`,
        "VoiceRecorder"
      );

      return voiceRecording;
    } catch (error) {
      this.cleanup();
      throw AppError.media("Failed to stop recording", error as Error);
    }
  }

  /**
   * Cancel current recording
   */
  async cancelRecording(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      this.isRecording = false;
      this.isPaused = false;
      this.stopAmplitudeMonitoring();

      // Note: Would stop and unload the recording with expo-av
      // await this.recording?.stopAndUnloadAsync();

      // Clean up
      if (this.recordingId) {
        storage.delete(`recording_${this.recordingId}`);
      }

      this.cleanup();

      logger.info(`Recording cancelled - ID: ${this.recordingId}`, "VoiceRecorder");
    } catch (error) {
      this.cleanup();
      throw AppError.media("Failed to cancel recording", error as Error);
    }
  }

  /**
   * Get current recording status
   */
  getRecordingStatus(): {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    recordingId: string | null;
  } {
    const duration = this.isRecording
      ? (Date.now() - this.startTime + this.pausedDuration) / 1000
      : 0;

    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      duration,
      recordingId: this.recordingId,
    };
  }

  /**
   * Get stored recording by ID
   */
  static getRecording(id: string): VoiceRecording | null {
    try {
      const data = storage.getString(`voice_${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error("Failed to get recording", error as Error, "VoiceRecorder");
      return null;
    }
  }

  /**
   * Get all stored recordings
   */
  static getAllRecordings(): VoiceRecording[] {
    try {
      const recordings: VoiceRecording[] = [];
      const keys = storage.getAllKeys();

      for (const key of keys) {
        if (key.startsWith("voice_")) {
          const data = storage.getString(key);
          if (data) {
            recordings.push(JSON.parse(data));
          }
        }
      }

      return recordings.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      logger.error("Failed to get all recordings", error as Error, "VoiceRecorder");
      return [];
    }
  }

  /**
   * Delete recording
   */
  static deleteRecording(id: string): boolean {
    try {
      storage.delete(`voice_${id}`);
      logger.info(`Recording deleted - ID: ${id}`, "VoiceRecorder");
      return true;
    } catch (error) {
      logger.error("Failed to delete recording", error as Error, "VoiceRecorder");
      return false;
    }
  }

  /**
   * Convert voice recording to ProcessedMedia for message sending
   */
  static toProcessedMedia(recording: VoiceRecording): ProcessedMedia {
    return {
      uri: recording.uri,
      processedUri: recording.uri,
      type: "audio",
      fileName: `voice_${recording.id}.m4a`,
      mimeType: "audio/m4a",
      fileSize: recording.fileSize,
      duration: recording.duration,
      originalSize: recording.fileSize,
      compressedSize: recording.fileSize,
      compressionRatio: 1,
    };
  }

  /**
   * Start monitoring amplitude for waveform generation
   */
  private startAmplitudeMonitoring(): void {
    this.amplitudeTimer = setInterval(() => {
      if (this.isRecording && !this.isPaused) {
        // Simulate amplitude reading (would use actual audio analysis)
        const amplitude = Math.random() * 0.8 + 0.2; // Random amplitude between 0.2 and 1.0
        this.amplitudeData.push(amplitude);

        // Limit waveform data points to prevent memory issues
        if (this.amplitudeData.length > 300) {
          // ~5 seconds of data at 60fps
          this.amplitudeData = this.amplitudeData.slice(-300);
        }
      }
    }, 1000 / 60); // 60fps for smooth waveform
  }

  /**
   * Stop amplitude monitoring
   */
  private stopAmplitudeMonitoring(): void {
    if (this.amplitudeTimer) {
      clearInterval(this.amplitudeTimer);
      this.amplitudeTimer = null;
    }
  }

  /**
   * Generate unique recording ID
   */
  private generateRecordingId(): string {
    return `voice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Clean up recording state
   */
  private cleanup(): void {
    this.recordingId = null;
    this.recordingUri = null;
    this.startTime = 0;
    this.pausedDuration = 0;
    this.amplitudeData = [];
    this.stopAmplitudeMonitoring();
  }

  /**
   * Get recording duration in MM:SS format
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}

// Export singleton instance
export const voiceRecorder = VoiceRecorder.getInstance();

// Export convenience functions
export const startRecording = voiceRecorder.startRecording.bind(voiceRecorder);
export const pauseRecording = voiceRecorder.pauseRecording.bind(voiceRecorder);
export const resumeRecording = voiceRecorder.resumeRecording.bind(voiceRecorder);
export const stopRecording = voiceRecorder.stopRecording.bind(voiceRecorder);
export const cancelRecording = voiceRecorder.cancelRecording.bind(voiceRecorder);
export const getRecordingStatus = voiceRecorder.getRecordingStatus.bind(voiceRecorder);
