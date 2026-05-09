/**
 * Media Processor
 * Handles image/video compression, resizing, and format conversion
 * Note: Requires expo-image-manipulator and expo-video-thumbnails to be installed
 */

import { AppError } from "../errors";

export type MediaType = "image" | "video" | "audio" | "document";

export interface MediaFile {
  uri: string;
  type: MediaType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number; // in seconds
  thumbnailUri?: string;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: "jpeg" | "png";
}

export interface ProcessedMedia extends MediaFile {
  processedUri: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

const DEFAULT_IMAGE_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: "jpeg",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export class MediaProcessor {
  /**
   * Process image file - compress and resize
   */
  static async processImage(
    uri: string,
    options: CompressionOptions = {}
  ): Promise<ProcessedMedia> {
    try {
      const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options };

      // TODO: Implement with expo-image-manipulator when installed
      // For now, return the original image
      const fileSize = await this.getFileSize(uri);

      return {
        uri,
        processedUri: uri,
        type: "image",
        fileName: this.generateFileName("image", opts.format || "jpeg"),
        mimeType: opts.format === "png" ? "image/png" : "image/jpeg",
        fileSize,
        originalSize: fileSize,
        compressedSize: fileSize,
        compressionRatio: 1,
      };
    } catch (error) {
      throw AppError.media("Failed to process image", error as Error);
    }
  }

  /**
   * Process video file - generate thumbnail
   */
  static async processVideo(uri: string): Promise<ProcessedMedia> {
    try {
      // TODO: Implement with expo-video-thumbnails when installed
      // Get video info
      const fileSize = await this.getFileSize(uri);

      return {
        uri,
        processedUri: uri, // Video not compressed, just validated
        type: "video",
        fileName: this.generateFileName("video", "mp4"),
        mimeType: "video/mp4",
        fileSize,
        originalSize: fileSize,
        compressedSize: fileSize,
        compressionRatio: 1,
      };
    } catch (error) {
      throw AppError.media("Failed to process video", error as Error);
    }
  }

  /**
   * Process audio file - validate format
   */
  static async processAudio(uri: string): Promise<ProcessedMedia> {
    try {
      const fileSize = await this.getFileSize(uri);

      // Validate file size
      if (fileSize > MAX_FILE_SIZE) {
        throw new Error("Audio file too large (max 50MB)");
      }

      return {
        uri,
        processedUri: uri,
        type: "audio",
        fileName: this.generateFileName("audio", "m4a"),
        mimeType: "audio/m4a",
        fileSize,
        originalSize: fileSize,
        compressedSize: fileSize,
        compressionRatio: 1,
      };
    } catch (error) {
      throw AppError.media("Failed to process audio", error as Error);
    }
  }

  /**
   * Process document file - validate
   */
  static async processDocument(uri: string, mimeType: string): Promise<ProcessedMedia> {
    try {
      const fileSize = await this.getFileSize(uri);

      // Validate file size
      if (fileSize > MAX_FILE_SIZE) {
        throw new Error("Document too large (max 50MB)");
      }

      const extension = this.getExtensionFromMimeType(mimeType);

      return {
        uri,
        processedUri: uri,
        type: "document",
        fileName: this.generateFileName("document", extension),
        mimeType,
        fileSize,
        originalSize: fileSize,
        compressedSize: fileSize,
        compressionRatio: 1,
      };
    } catch (error) {
      throw AppError.media("Failed to process document", error as Error);
    }
  }

  /**
   * Generate thumbnail for image
   */
  static async generateThumbnail(uri: string, maxSize: number = 300): Promise<string> {
    // TODO: Implement with expo-image-manipulator when installed
    return uri;
  }

  /**
   * Validate media file
   */
  static validateMedia(type: MediaType, fileSize: number): void {
    const limits: Record<MediaType, number> = {
      image: MAX_IMAGE_SIZE,
      video: MAX_VIDEO_SIZE,
      audio: MAX_FILE_SIZE,
      document: MAX_FILE_SIZE,
    };

    if (fileSize > limits[type]) {
      const maxMB = limits[type] / (1024 * 1024);
      throw new Error(`${type} file too large (max ${maxMB}MB)`);
    }
  }

  /**
   * Get file size from URI
   */
  private static async getFileSize(uri: string): Promise<number> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch {
      return 0;
    }
  }

  /**
   * Generate unique file name
   */
  private static generateFileName(type: MediaType, extension: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${type}_${timestamp}_${random}.${extension}`;
  }

  /**
   * Get file extension from MIME type
   */
  private static getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "text/plain": "txt",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "video/mp4": "mp4",
      "audio/m4a": "m4a",
      "audio/mp3": "mp3",
    };
    return extensions[mimeType] || "bin";
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Get media duration (for audio/video)
   */
  static async getMediaDuration(uri: string): Promise<number> {
    // This would require native modules for accurate duration
    // For now, return 0
    return 0;
  }
}
