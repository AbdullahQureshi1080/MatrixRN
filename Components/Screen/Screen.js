import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import React from 'react';
import newStyles from './ScreenStyles';

export default function Screen({children, navigation, isBack}) {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.BACKGROUND}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 30}
        style={styles.AVOIDING_VIEW}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
