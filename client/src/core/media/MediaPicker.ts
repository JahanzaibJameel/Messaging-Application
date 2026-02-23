/**
 * Media Picker
 * Handles picking media from camera and library
 */

// Note: expo-image-picker and expo-document-picker need to be installed
// import * as ImagePicker from 'expo-image-picker';
// import * as DocumentPicker from 'expo-document-picker';
import { AppError } from '../errors';
import { logger } from '../logger';
import { MediaProcessor, type MediaFile, type ProcessedMedia } from './MediaProcessor';

export type PickerSource = 'camera' | 'library' | 'document';

export interface PickerOptions {
  allowsMultipleSelection?: boolean;
  mediaTypes?: 'images' | 'videos' | 'all';
  maxSelection?: number;
}

const DEFAULT_OPTIONS: PickerOptions = {
  allowsMultipleSelection: false,
  mediaTypes: 'all',
  maxSelection: 10,
};

export class MediaPicker {
  /**
   * Request necessary permissions
   */
  static async requestPermissions(source: PickerSource): Promise<boolean> {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        return status === 'granted';
      } else if (source === 'library') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
      }
      return true;
    } catch (error) {
      logger.error('Permission error', error as Error, 'MediaPicker');
      return false;
    }
  }

  /**
   * Pick image from camera
   */
  static async takePhoto(options: PickerOptions = {}): Promise<ProcessedMedia | null> {
    const hasPermission = await this.requestPermissions('camera');
    if (!hasPermission) {
      throw AppError.permission('Camera permission not granted');
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return await MediaProcessor.processImage(asset.uri);
    } catch (error) {
      throw AppError.media('Failed to take photo', error as Error);
    }
  }

  /**
   * Pick media from library
   */
  static async pickFromLibrary(options: PickerOptions = {}): Promise<ProcessedMedia[]> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    const hasPermission = await this.requestPermissions('library');
    if (!hasPermission) {
      throw AppError.permission('Media library permission not granted');
    }

    try {
      const mediaTypeMap = {
        images: ImagePicker.MediaTypeOptions.Images,
        videos: ImagePicker.MediaTypeOptions.Videos,
        all: ImagePicker.MediaTypeOptions.All,
      };

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypeMap[opts.mediaTypes!],
        allowsMultipleSelection: opts.allowsMultipleSelection,
        selectionLimit: opts.maxSelection,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets) {
        return [];
      }

      const processedMedia: ProcessedMedia[] = [];

      for (const asset of result.assets) {
        try {
          let processed: ProcessedMedia;

          if (asset.type === 'video') {
            processed = await MediaProcessor.processVideo(asset.uri);
          } else {
            processed = await MediaProcessor.processImage(asset.uri);
          }

          processedMedia.push(processed);
        } catch (error) {
          logger.error('Failed to process media', error as Error, 'MediaPicker');
          // Continue with other assets
        }
      }

      return processedMedia;
    } catch (error) {
      throw AppError.media('Failed to pick media from library', error as Error);
    }
  }

  /**
   * Pick document
   */
  static async pickDocument(): Promise<ProcessedMedia | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return await MediaProcessor.processDocument(asset.uri, asset.mimeType || 'application/octet-stream');
    } catch (error) {
      throw AppError.media('Failed to pick document', error as Error);
    }
  }

  /**
   * Pick audio file
   */
  static async pickAudio(): Promise<ProcessedMedia | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return await MediaProcessor.processAudio(asset.uri);
    } catch (error) {
      throw AppError.media('Failed to pick audio', error as Error);
    }
  }

  /**
   * Quick pick - single image
   */
  static async quickImage(): Promise<ProcessedMedia | null> {
    return this.pickFromLibrary({ mediaTypes: 'images', allowsMultipleSelection: false })
      .then(results => results[0] || null);
  }

  /**
   * Quick pick - single video
   */
  static async quickVideo(): Promise<ProcessedMedia | null> {
    return this.pickFromLibrary({ mediaTypes: 'videos', allowsMultipleSelection: false })
      .then(results => results[0] || null);
  }

  /**
   * Pick multiple images
   */
  static async pickMultipleImages(maxCount: number = 10): Promise<ProcessedMedia[]> {
    return this.pickFromLibrary({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      maxSelection: maxCount,
    });
  }

  /**
   * Check if file type is image
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if file type is video
   */
  static isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  /**
   * Check if file type is audio
   */
  static isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
  }

  /**
   * Get file icon based on type
   */
  static getFileIcon(mimeType: string): string {
    if (this.isImage(mimeType)) return 'image';
    if (this.isVideo(mimeType)) return 'video';
    if (this.isAudio(mimeType)) return 'music';
    if (mimeType.includes('pdf')) return 'file-pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'file-excel';
    return 'file';
  }
}

// Export convenience functions
export const takePhoto = MediaPicker.takePhoto.bind(MediaPicker);
export const pickFromLibrary = MediaPicker.pickFromLibrary.bind(MediaPicker);
export const pickDocument = MediaPicker.pickDocument.bind(MediaPicker);
export const pickAudio = MediaPicker.pickAudio.bind(MediaPicker);
export const quickImage = MediaPicker.quickImage.bind(MediaPicker);
export const quickVideo = MediaPicker.quickVideo.bind(MediaPicker);
export const pickMultipleImages = MediaPicker.pickMultipleImages.bind(MediaPicker);
