import {Dimensions, StyleSheet, useColorScheme} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {calculateWidth} from '../../Utils/Styling';

// console.log('THE COLORS', Colors);

const styles = (isDarkMode, size) =>
  StyleSheet.create({
    CONTAINER: {
      backgroundColor: Colors.primary,
      borderRadius: 8,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      //   marginHorizontal: 20,
      width: calculateWidth(size),
    },
    NAME: {
      fontSize: 16,
      alignSelf: 'center',
      color: Colors.light,
      fontWeight: '700',
    },
    PRIMARY: {
      position: 'absolute',
      bottom: 0,
    },
  });

export default styles;
