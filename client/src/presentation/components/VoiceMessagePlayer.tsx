/**
 * Voice Message Player Component
 * Handles playback of voice messages with waveform visualization
 */

import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { useUIStore } from "../stores";
import type { VoiceRecording } from "../../core/media/VoiceRecorder";

interface VoiceMessagePlayerProps {
  recording: VoiceRecording;
  maxHeight?: number;
  showDuration?: boolean;
  onPlaybackComplete?: () => void;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  recording,
  maxHeight = 80,
  showDuration = true,
  onPlaybackComplete,
}) => {
  const theme = useTheme();
  const { showToast } = useUIStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(recording.duration);

  const progressAnimation = useRef(new Animated.Value(0)).current;
  const playbackTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update progress animation
  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: duration > 0 ? currentPosition / duration : 0,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [currentPosition, duration, progressAnimation]);

  // Handle playback timer
  useEffect(() => {
    if (isPlaying) {
      playbackTimer.current = setInterval(() => {
        setCurrentPosition((prev) => {
          const next = prev + 0.1;
          if (next >= duration) {
            setIsPlaying(false);
            onPlaybackComplete?.();
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
        playbackTimer.current = null;
      }
    }

    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    };
  }, [isPlaying, duration, onPlaybackComplete]);

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        // Note: Would pause actual audio with expo-av
        // await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        // Note: Would play actual audio with expo-av
        // await sound.replayAsync();
        setIsPlaying(true);

        if (currentPosition >= duration) {
          setCurrentPosition(0);
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        message: "Failed to play voice message",
      });
    }
  };

  const handleSeek = (position: number) => {
    setCurrentPosition(position);
    // Note: Would seek actual audio with expo-av
    // await sound.setPositionAsync(position * 1000);
  };

  const renderWaveform = () => {
    if (recording.waveform.length === 0) {
      return (
        <View style={styles.placeholderWaveform}>
          {[...Array(20)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.placeholderBar,
                {
                  backgroundColor: theme.theme.border,
                  height: Math.random() * 40 + 10,
                },
              ]}
            />
          ))}
        </View>
      );
    }

    return (
      <View style={styles.waveformContainer}>
        {recording.waveform.map((amplitude, index) => {
          const height = amplitude * maxHeight * 0.8;
          const isPlayed = index / recording.waveform.length < currentPosition / duration;
          const opacity = isPlayed ? 0.4 : 0.8;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.waveformBar,
                {
                  height,
                  backgroundColor: isPlayed ? theme.theme.textSecondary : theme.theme.primary,
                  opacity,
                },
              ]}
              onPress={() => {
                const seekPosition = (index / recording.waveform.length) * duration;
                handleSeek(seekPosition);
              }}
              activeOpacity={0.7}
            />
          );
        })}
      </View>
    );
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <View style={[styles.container, { maxHeight }]}>
      {/* Waveform visualization */}
      <View style={styles.waveformSection}>
        {renderWaveform()}

        {/* Progress indicator */}
        <Animated.View
          style={[
            styles.progressIndicator,
            {
              left: progressAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: theme.theme.primary,
            },
          ]}
        />
      </View>

      {/* Controls and info */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: theme.theme.primary }]}
          onPress={handlePlayPause}
          activeOpacity={0.7}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.info}>
          {showDuration && (
            <Text style={[styles.duration, { color: theme.theme.text }]}>
              {formatDuration(currentPosition)} / {formatDuration(duration)}
            </Text>
          )}
          <Text style={[styles.fileSize, { color: theme.theme.textSecondary }]}>
            {formatFileSize(recording.fileSize)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    marginVertical: 4,
  },
  waveformSection: {
    height: 60,
    justifyContent: "center",
    marginBottom: 8,
    position: "relative",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  waveformBar: {
    width: 2,
    marginHorizontal: 0.5,
    borderRadius: 1,
  },
  placeholderWaveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  placeholderBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 2,
    opacity: 0.3,
  },
  progressIndicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  info: {
    flex: 1,
  },
  duration: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
  },
});
