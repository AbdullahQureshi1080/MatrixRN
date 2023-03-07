import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  useColorScheme,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useReducer, useEffect} from 'react';

import newStyles from './VerificationStyles';

import {useNavigation} from '@react-navigation/native';

import matrix from '../../App';
import MatrixService from '../../Services/MatrixChatService';
import Button from '../../Components/Button/Button';

import {CryptoService, StartVerification} from '../../Services/crypto';
import {color} from '../../Utils/Color';

function VerificationModal({
  isVisible,
  setIsVisible,
  ChatService,
  verificationRequest,
}) {
  const [emojies, setEmojies] = useState([]);
  const [emojisText, setEmojiesText] = useState([]);

  const [verification, setVerification] = useState(null);

  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();
  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode);

  // let emojisText = [];

  const onConfirmVerification = (verification, status) => {
    console.log('Hello', verification);
    if (verification) {
      setVerification(verification);
      // return verification.handleResult(status);
    }
    // return verification.handleResult(status);
  };

  useEffect(() => {
    ChatService.sendVerificationRequest(
      setIsVisible,
      setEmojies,
      onConfirmVerification,
      verificationRequest,
    );
  }, []);

  useEffect(() => {
    if (emojies && emojies.length) {
      let emojiesArr = [];
      for (const emoji of emojies) emojiesArr.push(`${emoji[0]} (${emoji[1]})`);
      console.log(`Emojis are here: ${emojiesArr.join(', ')}`);
      setEmojiesText(emojiesArr);
      setLoading(false);
    }
  }, [emojies]);

  return (
    <Modal visible={isVisible}>
      <View style={{flex: 1}}>
        <Text style={styles.SCREEN_TITLE}>Verification </Text>
        <View style={styles.SECTION_CONTAINER}>
          <Text
            style={[
              styles.SECTION_TITLE,
              {color: color.icon, marginBottom: 20},
            ]}>{`Emojis are here:`}</Text>
          {!loading ? (
            <Text style={[styles.SECTION_TITLE, {color: color.primary}]}>
              {emojies && !loading && `${emojisText?.join(', ')}`}
            </Text>
          ) : (
            <ActivityIndicator size="small" color={color.icon} />
          )}

          <Text style={styles.HELPER_TEXT}>
            Please confirm if the emoji pattern match or not, requested from the
            other device.
          </Text>
        </View>

        <View style={styles.SECTION_CONTAINER}>
          <Button
            name={"They don't Match"}
            type="PRIMARY"
            size={'MEDIUM'}
            onPress={() => {
              verification.handleResult(false);
              setIsVisible(false);
              Alert.alert('Verification Cancelled');
            }}
            containerStyle={{backgroundColor: color.error}}
            labelStyle={{color: color.greyLight}}
          />

          <Button
            name={'They Match'}
            type="PRIMARY"
            size={'MEDIUM'}
            onPress={() => {
              verification?.handleResult(true);
              setIsVisible(false);
              Alert.alert('Verification Complete');
            }}
            containerStyle={{backgroundColor: color.success}}
            labelStyle={{color: color.greyLight}}
          />
        </View>
      </View>
      <Button
        name={'Close'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => setIsVisible(false)}
      />
    </Modal>
  );
}

export default VerificationModal;
