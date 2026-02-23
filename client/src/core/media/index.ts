/**
 * Media handling exports
 */

export {
  MediaProcessor,
  type MediaType,
  type MediaFile,
  type ProcessedMedia,
  type CompressionOptions,
} from './MediaProcessor';

export {
  MediaUploader,
  type UploadProgress,
  type UploadResult,
  type UploadProgressCallback,
  mediaUploader,
} from './MediaUploader';

export {
  MediaPicker,
  type PickerSource,
  type PickerOptions,
  takePhoto,
  pickFromLibrary,
  pickDocument,
  pickAudio,
  quickImage,
  quickVideo,
  pickMultipleImages,
} from './MediaPicker';

export { useMedia, useChatMedia } from './useMedia';
