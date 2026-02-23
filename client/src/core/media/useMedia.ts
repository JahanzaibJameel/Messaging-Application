/**
 * Media React Hook
 * Provides media handling functionality for React components
 */

import { useState, useCallback, useRef } from 'react';
import { MediaPicker, type PickerOptions } from './MediaPicker';
import { MediaUploader, type UploadProgress, type UploadResult } from './MediaUploader';
import { MediaProcessor, type ProcessedMedia, type CompressionOptions } from './MediaProcessor';
import type { MediaType } from './MediaProcessor';

interface UseMediaOptions {
  onUploadProgress?: (progress: UploadProgress) => void;
  onUploadComplete?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

interface MediaState {
  isProcessing: boolean;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: Error | null;
}

export function useMedia(options: UseMediaOptions = {}) {
  const { onUploadProgress, onUploadComplete, onError } = options;
  const [state, setState] = useState<MediaState>({
    isProcessing: false,
    isUploading: false,
    progress: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const setProcessing = useCallback((isProcessing: boolean) => {
    setState((prev) => ({ ...prev, isProcessing }));
  }, []);

  const setUploading = useCallback((isUploading: boolean) => {
    setState((prev) => ({ ...prev, isUploading }));
  }, []);

  const setProgress = useCallback((progress: UploadProgress | null) => {
    setState((prev) => ({ ...prev, progress }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  /**
   * Take photo with camera
   */
  const takePhoto = useCallback(async () => {
    setProcessing(true);
    setError(null);

    try {
      const media = await MediaPicker.takePhoto();
      return media;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      onError?.(err);
      return null;
    } finally {
      setProcessing(false);
    }
  }, [onError, setProcessing, setError]);

  /**
   * Pick from library
   */
  const pickFromLibrary = useCallback(async (opts?: PickerOptions) => {
    setProcessing(true);
    setError(null);

    try {
      const media = await MediaPicker.pickFromLibrary(opts);
      return media;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      onError?.(err);
      return [];
    } finally {
      setProcessing(false);
    }
  }, [onError, setProcessing, setError]);

  /**
   * Pick document
   */
  const pickDocument = useCallback(async () => {
    setProcessing(true);
    setError(null);

    try {
      const media = await MediaPicker.pickDocument();
      return media;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      onError?.(err);
      return null;
    } finally {
      setProcessing(false);
    }
  }, [onError, setProcessing, setError]);

  /**
   * Pick audio
   */
  const pickAudio = useCallback(async () => {
    setProcessing(true);
    setError(null);

    try {
      const media = await MediaPicker.pickAudio();
      return media;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      onError?.(err);
      return null;
    } finally {
      setProcessing(false);
    }
  }, [onError, setProcessing, setError]);

  /**
   * Process image
   */
  const processImage = useCallback(async (uri: string, opts?: CompressionOptions) => {
    setProcessing(true);
    setError(null);

    try {
      const processed = await MediaProcessor.processImage(uri, opts);
      return processed;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      onError?.(err);
      return null;
    } finally {
      setProcessing(false);
    }
  }, [onError, setProcessing, setError]);

  /**
   * Upload media
   */
  const upload = useCallback(async (media: ProcessedMedia): Promise<UploadResult | null> => {
    setUploading(true);
    setProgress(null);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const uploader = new MediaUploader();
      const result = await uploader.upload(media, (progress) => {
        setProgress(progress);
        onUploadProgress?.(progress);
      });

      onUploadComplete?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      onError?.(err);
      return null;
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  }, [onUploadProgress, onUploadComplete, onError, setUploading, setProgress, setError]);

  /**
   * Upload multiple media files
   */
  const uploadMultiple = useCallback(async (
    mediaItems: ProcessedMedia[],
    onItemProgress?: (index: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> => {
    setUploading(true);
    setError(null);

    const results: UploadResult[] = [];

    try {
      const uploader = new MediaUploader();

      for (let i = 0; i < mediaItems.length; i++) {
        const result = await uploader.upload(mediaItems[i], (progress) => {
          setProgress(progress);
          onItemProgress?.(i, progress);
        });
        results.push(result);
      }

      return results;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      onError?.(err);
      return results;
    } finally {
      setUploading(false);
    }
  }, [onError, setUploading, setProgress, setError]);

  /**
   * Pick and upload in one step
   */
  const pickAndUpload = useCallback(async (opts?: PickerOptions): Promise<UploadResult | null> => {
    const media = await pickFromLibrary(opts);
    if (media.length === 0) return null;

    return upload(media[0]);
  }, [pickFromLibrary, upload]);

  /**
   * Cancel current upload
   */
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploading(false);
  }, [setUploading]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      isUploading: false,
      progress: null,
      error: null,
    });
  }, []);

  return {
    // State
    ...state,

    // Actions
    takePhoto,
    pickFromLibrary,
    pickDocument,
    pickAudio,
    processImage,
    upload,
    uploadMultiple,
    pickAndUpload,
    cancelUpload,
    reset,
  };
}

// Hook for chat media
export function useChatMedia(chatId: string) {
  const media = useMedia();

  const sendMediaMessage = useCallback(async (type: MediaType, uri: string) => {
    // Process media
    let processed: ProcessedMedia | null = null;

    switch (type) {
      case 'image':
        processed = await media.processImage(uri);
        break;
      case 'video':
        processed = await MediaProcessor.processVideo(uri);
        break;
      case 'audio':
        processed = await MediaProcessor.processAudio(uri);
        break;
      case 'document':
        // Need mime type for documents
        processed = null;
        break;
    }

    if (!processed) {
      return null;
    }

    // Upload
    const uploadResult = await media.upload(processed);
    return uploadResult;
  }, [media]);

  return {
    ...media,
    sendMediaMessage,
  };
}
