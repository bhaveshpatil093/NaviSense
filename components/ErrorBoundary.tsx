import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, DevSettings } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'Unknown error occurred' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary', error);
  }

  handleRestart = () => {
    try {
      DevSettings.reload();
    } catch (e) {
      logger.error('ErrorBoundaryRestart', e);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <MaterialCommunityIcons 
            name="alert-circle-outline" 
            size={64} 
            color={Colors.accentRed} 
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
          <Text style={styles.heading}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.errorMessage}</Text>
          <Pressable 
            style={styles.restartButton} 
            onPress={this.handleRestart}
            accessibilityRole="button"
            accessibilityLabel="Restart App"
            accessibilityHint="Reloads the application"
          >
            <Text style={styles.restartText}>Restart App</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.xl,
  },
  heading: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.xl,
    color: Colors.textPrimary,
    marginTop: Layout.lg,
    marginBottom: Layout.sm,
  },
  errorText: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Layout.xxl,
  },
  restartButton: {
    backgroundColor: Colors.accentBlue,
    paddingVertical: Layout.md,
    paddingHorizontal: Layout.xl,
    borderRadius: Layout.radiusFull,
  },
  restartText: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
  },
});
