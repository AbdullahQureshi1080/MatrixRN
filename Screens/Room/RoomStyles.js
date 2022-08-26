import {StyleSheet, useColorScheme} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

// console.log('THE COLORS', Colors);

const styles = isDarkMode =>
  StyleSheet.create({
    BACKGROUND: {
      backgroundColor: 'transparent',
      //   backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
      flex: 1,
    },
    SCREEN_TITLE: {
      fontSize: 30,
      alignSelf: 'center',
    },
    HEADING: {},
    INPUT_BOX: {
      flexDirection: 'row',
      marginVertical: 10,
      marginHorizontal: 20,
      justifyContent: 'space-between',
    },
    LABEL: {
      fontSize: 16,
      fontWeight: '400',
      marginBottom: 10,
    },
    INPUT: {
      width: '75%',
      borderWidth: 1,
      borderRadius: 8,
      borderColor: Colors.light,
      paddingHorizontal: 5,
      height: 40,
      fontSize: 16,
    },
    SECTION_CONTAINER: {
      marginTop: 32,
      paddingHorizontal: 24,
    },
    SECTION_TITLE: {
      fontSize: 24,
      fontWeight: '600',
      marginBottom: 10,
    },
    SECTION_DESCRIPTION: {
      marginTop: 8,
      fontSize: 18,
      fontWeight: '400',
    },
    highlight: {
      fontWeight: '700',
    },
    ACTIVITY_INDICATOR: {
      alignSelf: 'center',
    },
    ACIVITY_WAIT_VIEW: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default styles;
