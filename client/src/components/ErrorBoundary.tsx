/**
 * Error Boundary Component
 * Catches JavaScript errors in component tree and reports to Sentry
 */

import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { captureException } from "../monitoring/sentry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    try {
      captureException(error, {
        action: "component_render",
        screen: "error_boundary",
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      });
    } catch (sentryError) {
      console.error("Failed to report error to Sentry:", sentryError);
    }

    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  handleReportError = () => {
    if (this.state.error) {
      try {
        captureException(this.state.error, {
          action: "user_reported_error",
          screen: "error_boundary",
          additionalData: {
            userFeedback: true,
            componentStack: this.state.errorInfo?.componentStack,
          },
        });
      } catch (sentryError) {
        console.error("Failed to report user feedback to Sentry:", sentryError);
      }
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text
              style={styles.title}
              accessible={true}
              accessibilityLabel="Error occurred"
              accessibilityRole="header"
            >
              Oops! Something went wrong
            </Text>

            <Text
              style={styles.message}
              accessible={true}
              accessibilityLabel="Error message description"
            >
              We encountered an unexpected error. The issue has been reported to our team.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Development Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>

                {this.state.errorInfo && (
                  <>
                    <Text style={styles.errorTitle}>Component Stack:</Text>
                    <Text style={styles.errorText}>{this.state.errorInfo.componentStack}</Text>
                  </>
                )}
              </ScrollView>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={this.handleRetry}
                accessible={true}
                accessibilityLabel="Retry loading the screen"
                accessibilityHint="Attempts to reload the screen that caused the error"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>Retry</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.reportButton]}
                onPress={this.handleReportError}
                accessible={true}
                accessibilityLabel="Report this problem"
                accessibilityHint="Send additional information about this error to our team"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>Report Problem</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    maxWidth: 400,
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  errorDetails: {
    maxHeight: 200,
    width: "100%",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#495057",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#6c757d",
    fontFamily: "monospace",
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  retryButton: {
    backgroundColor: "#007AFF",
  },
  reportButton: {
    backgroundColor: "#28a745",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ErrorBoundary;
