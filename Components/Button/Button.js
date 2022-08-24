import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import React from 'react';
import newStyles from './ButtonStyles';

export default function Button({name, onPress, type, size, ...props}) {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode, size);

  const getButtonStyles = type => {
    if (type == 'PRIMARY') {
      return styles.PRIMARY;
    }
    if (type == 'SECONDARY') {
      return styles.PRIMARY;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.CONTAINER, getButtonStyles(type)]}
      onPress={onPress}
      {...props}>
      <Text style={styles.NAME}>{name}</Text>
    </TouchableOpacity>
  );
}
