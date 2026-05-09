import React, { useState, useCallback } from 'react';
import { Image, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

interface OptimizedImageProps {
  source: { uri: string } | number;
  placeholder?: { uri: string } | number;
  style?: any;
  width?: number;
  height?: number;
  resizeMode?: 'cover' | 'contain' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  placeholder,
  style,
  width = 100,
  height = 100,
  resizeMode = 'cover',
  onLoad,
  onError,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  const getLowResPlaceholder = useCallback(() => {
    if (typeof source === 'object' && source.uri) {
      return { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' };
    }
    return source;
  }, [source]);

  if (hasError) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <View style={styles.errorContainer}>
          <View style={[styles.errorPlaceholder, { width: width * 0.3, height: height * 0.3 }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }, style]}>
      <ExpoImage
        source={source}
        placeholder={getLowResPlaceholder()}
        style={[styles.image, { width, height }]}
        contentFit={resizeMode}
        onLoad={handleLoad}
        onError={handleError}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        cachePolicy="memory-disk"
        transition={{ duration: 300 }}
        recyclingKey={typeof source === 'object' ? source.uri : 'static'}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: '#f0f0f0',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  errorPlaceholder: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
});

export default OptimizedImage;
