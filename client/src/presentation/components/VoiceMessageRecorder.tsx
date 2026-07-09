import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { voiceRecorder, VoiceRecorder, type VoiceRecording } from "../../core/media/VoiceRecorder";
import { useUIStore } from "../stores";

interface VoiceMessageRecorderProps {
  onRecordingComplete: (recording: VoiceRecording) => void;
  maxHeight?: number;
}

export const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({
  onRecordingComplete,
  maxHeight = 120,
}) => {
  const theme = useTheme();
  const { showToast } = useUIStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [statusText, setStatusText] = useState("Tap to record");

  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const waveformAnimation = useRef(new Animated.Value(0)).current;

  // Update recording status
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRecording && !isPaused) {
        const status = voiceRecorder.getRecordingStatus();
        setDuration(status.duration);

        // Simulate waveform data (would come from actual recorder)
        if (Math.random() > 0.3) {
          // Add some variation
          setWaveform((prev) => {
            const newWaveform = [...prev, Math.random() * 0.8 + 0.2];
            return newWaveform.slice(-50); // Keep last 50 points
          });
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Pulse animation for recording button
  useEffect(() => {
    if (isRecording && !isPaused) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]);

      const pulseLoop = Animated.loop(pulse);
      pulseLoop.start();

      return () => pulseLoop.stop();
    } else {
      pulseAnimation.setValue(1);
      return undefined;
    }
  }, [isRecording, isPaused, pulseAnimation]);

  // Animate waveform
  useEffect(() => {
    if (waveform.length > 0) {
      Animated.timing(waveformAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [waveform, waveformAnimation]);

  const handleStartRecording = async () => {
    try {
      const recordingId = await voiceRecorder.startRecording({
        maxDuration: 60, // 1 minute
        quality: "medium",
        format: "m4a",
      });

      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setWaveform([]);
      setStatusText("Recording... Tap to pause");

      showToast({
        type: "info",
        message: "Recording started",
      });
    } catch (error) {
      showToast({
        type: "error",
        message: "Failed to start recording",
      });
    }
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      try {
        await voiceRecorder.resumeRecording();
        setIsPaused(false);
        setStatusText("Recording... Tap to pause");
      } catch (error) {
        showToast({
          type: "error",
          message: "Failed to resume recording",
        });
      }
    } else {
      try {
        await voiceRecorder.pauseRecording();
        setIsPaused(true);
        setStatusText("Paused - Tap to resume");
      } catch (error) {
        showToast({
          type: "error",
          message: "Failed to pause recording",
        });
      }
    }
  };

  const handleStopRecording = async () => {
    try {
      const recording = await voiceRecorder.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setWaveform([]);
      setStatusText("Tap to record");

      onRecordingComplete(recording);

      showToast({
        type: "success",
        message: `Voice message recorded (${VoiceRecorder.formatDuration(recording.duration)})`,
      });
    } catch (error) {
      showToast({
        type: "error",
        message: "Failed to stop recording",
      });
    }
  };

  const handleCancelRecording = async () => {
    try {
      await voiceRecorder.cancelRecording();
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setWaveform([]);
      setStatusText("Tap to record");

      showToast({
        type: "info",
        message: "Recording cancelled",
      });
    } catch (error) {
      showToast({
        type: "error",
        message: "Failed to cancel recording",
      });
    }
  };

  const renderWaveform = () => {
    if (waveform.length === 0) return null;

    return (
      <View style={styles.waveformContainer}>
        {waveform.map((amplitude, index) => {
          const height = amplitude * maxHeight * 0.8; // 80% of max height
          const opacity = isPaused ? 0.4 : 0.8;

          return (
            <Animated.View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height,
                  backgroundColor: isPaused ? theme.theme.textSecondary : theme.theme.primary,
                  opacity,
                  transform: [
                    {
                      scaleY: waveformAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  if (!isRecording) {
    return (
      <View style={[styles.container, { maxHeight }]}>
        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: theme.theme.primary }]}
          onPress={handleStartRecording}
          activeOpacity={0.7}
        >
          <Ionicons name="mic" size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.statusText, { color: theme.theme.textSecondary }]}>{statusText}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { maxHeight, backgroundColor: theme.theme.card }]}>
      {/* Waveform visualization */}
      <View style={styles.waveformSection}>
        {renderWaveform()}
        {waveform.length === 0 && (
          <View style={styles.placeholderWaveform}>
            <View style={[styles.placeholderBar, { backgroundColor: theme.theme.border }]} />
            <View style={[styles.placeholderBar, { backgroundColor: theme.theme.border }]} />
            <View style={[styles.placeholderBar, { backgroundColor: theme.theme.border }]} />
            <View style={[styles.placeholderBar, { backgroundColor: theme.theme.border }]} />
            <View style={[styles.placeholderBar, { backgroundColor: theme.theme.border }]} />
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.cancelButton]}
          onPress={handleCancelRecording}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={theme.theme.text} />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.pauseButton,
              { backgroundColor: isPaused ? theme.theme.primary : theme.theme.warning },
            ]}
            onPress={handlePauseResume}
            activeOpacity={0.7}
          >
            <Ionicons name={isPaused ? "play" : "pause"} size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton]}
          onPress={handleStopRecording}
          activeOpacity={0.7}
        >
          <Ionicons name="square" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.statusSection}>
        <Text style={[styles.duration, { color: theme.theme.text }]}>
          {VoiceRecorder.formatDuration(duration)}
        </Text>
        <Text style={[styles.statusText, { color: theme.theme.textSecondary }]}>{statusText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  waveformSection: {
    height: 80,
    justifyContent: "center",
    marginBottom: 16,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  waveformBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  placeholderWaveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  placeholderBar: {
    width: 4,
    height: 20,
    marginHorizontal: 2,
    borderRadius: 2,
    opacity: 0.3,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  pauseButton: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  stopButton: {
    backgroundColor: "#ff3b30",
  },
  statusSection: {
    alignItems: "center",
  },
  duration: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
});
