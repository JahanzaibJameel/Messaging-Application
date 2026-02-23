/**
 * Media Uploader
 * Handles uploading media files to cloud storage with progress tracking
 */

import { AppError } from '../errors';
import type { ProcessedMedia, MediaType } from './MediaProcessor';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    fileSize: number;
    mimeType: string;
  };
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

interface UploadTask {
  id: string;
  media: ProcessedMedia;
  abortController: AbortController;
  progressCallback?: UploadProgressCallback;
}

const UPLOAD_URL = process.env.EXPO_PUBLIC_UPLOAD_URL || 'https://api.chatapp.com/upload';
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for resumable uploads

export class MediaUploader {
  private activeUploads: Map<string, UploadTask> = new Map();

  /**
   * Upload media file
   */
  async upload(
    media: ProcessedMedia,
    onProgress?: UploadProgressCallback
  ): Promise<UploadResult> {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create form data
      const formData = new FormData();
      
      // Append file
      const fileBlob = await this.uriToBlob(media.processedUri);
      formData.append('file', fileBlob, media.fileName);
      formData.append('type', media.type);
      formData.append('mimeType', media.mimeType);
      
      if (media.width) formData.append('width', media.width.toString());
      if (media.height) formData.append('height', media.height.toString());
      if (media.duration) formData.append('duration', media.duration.toString());

      // Upload thumbnail if exists
      if (media.thumbnailUri) {
        const thumbnailBlob = await this.uriToBlob(media.thumbnailUri);
        formData.append('thumbnail', thumbnailBlob, `thumb_${media.fileName}`);
      }

      const abortController = new AbortController();
      
      const task: UploadTask = {
        id: uploadId,
        media,
        abortController,
        progressCallback: onProgress,
      };
      
      this.activeUploads.set(uploadId, task);

      // Perform upload with progress tracking
      const response = await this.performUpload(formData, abortController, onProgress);
      
      this.activeUploads.delete(uploadId);
      
      return response;
    } catch (error) {
      this.activeUploads.delete(uploadId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw AppError.network('Upload cancelled', error);
      }
      
      throw AppError.network('Failed to upload media', error as Error);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    mediaItems: ProcessedMedia[],
    onProgress?: (index: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < mediaItems.length; i++) {
      const result = await this.upload(mediaItems[i], (progress) => {
        onProgress?.(i, progress);
      });
      results.push(result);
    }
    
    return results;
  }

  /**
   * Cancel upload
   */
  cancelUpload(uploadId: string): boolean {
    const task = this.activeUploads.get(uploadId);
    if (task) {
      task.abortController.abort();
      this.activeUploads.delete(uploadId);
      return true;
    }
    return false;
  }

  /**
   * Cancel all uploads
   */
  cancelAllUploads(): void {
    this.activeUploads.forEach((task) => {
      task.abortController.abort();
    });
    this.activeUploads.clear();
  }

  /**
   * Get active upload count
   */
  getActiveUploadCount(): number {
    return this.activeUploads.size;
  }

  /**
   * Perform the actual upload
   */
  private async performUpload(
    formData: FormData,
    abortController: AbortController,
    onProgress?: UploadProgressCallback
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          };
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.url,
              thumbnailUrl: response.thumbnailUrl,
              metadata: response.metadata,
            });
          } catch {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));
      xhr.onabort = () => reject(new Error('Upload cancelled'));

      xhr.open('POST', UPLOAD_URL);
      xhr.setRequestHeader('Accept', 'application/json');
      
      // Add auth token if available
      const authToken = this.getAuthToken();
      if (authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
      }

      xhr.send(formData);

      // Handle abort
      abortController.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    });
  }

  /**
   * Convert URI to Blob for upload
   */
  private async uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return response.blob();
  }

  /**
   * Get auth token from store
   */
  private getAuthToken(): string | null {
    // This would integrate with auth store
    return null;
  }

  /**
   * Get upload URL for media type
   */
  private getUploadUrl(type: MediaType): string {
    return `${UPLOAD_URL}/${type}`;
  }
}

// Singleton instance
export const mediaUploader = new MediaUploader();
