//  Native Imports

import React, {useEffect, useState} from 'react';

import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  PermissionsAndroid,
  Alert,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';

import Modal from 'react-native-modal';

import Entypo from 'react-native-vector-icons/Entypo';

import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Button from '../Button/Button';

import {color} from '../../Utils/Color';

function CameraModal({
  isVisible,
  setIsVisible,
  image,
  title,
  subtitle,
  onPressLiveImage,
  onPressGallerySelect,
  onChangeImage,
  imageUri,
  style,
  showPreview,
  onPressUpload,
}) {
  const [busy, setbusy] = useState(true);

  useEffect(() => {
    requestCameraPermission();
    requestExternalWritePermission();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,

          {
            title: 'Camera Permission',

            message: 'App needs camera permission',
          },
        );

        // If CAMERA Permission is granted

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);

        return false;
      }
    } else return true;
  };

  const requestExternalWritePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,

          {
            title: 'External Storage Write Permission',

            message: 'App needs write permission',
          },
        );

        // If WRITE_EXTERNAL_STORAGE Permission is granted

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);

        Alert.alert('Write permission err', err);
      }

      return false;
    } else return true;
  };

  const selectImage = async () => {
    let options = {
      mediaType: 'photo',

      // maxWidth: 500,

      // maxHeight: 500,

      quality: 1,

      // videoQuality: 'low',

      // durationLimit: 30, //Video max duration in seconds

      saveToPhotos: true,
    };

    let isCameraPermitted = await requestCameraPermission();

    let isStoragePermitted = await requestExternalWritePermission();

    if (isCameraPermitted && isStoragePermitted) {
      launchImageLibrary(options, response => {
        console.log('Response = ', response);

        if (response.didCancel) {
          // Alert.alert('User cancelled camera picker');

          return;
        } else if (response.errorCode === 'camera_unavailable') {
          Alert.alert('Camera not available on device');

          return;
        } else if (response.errorCode === 'permission') {
          Alert.alert('Permission not satisfied');

          return;
        } else if (response.errorCode === 'others') {
          Alert.alert(response.errorMessage);

          return;
        }

        console.log('base64 -> ', response.base64);

        console.log('uri -> ', response.uri);

        console.log('width -> ', response.width);

        console.log('height -> ', response.height);

        console.log('fileSize -> ', response.fileSize);

        console.log('type -> ', response.type);

        console.log('fileName -> ', response.fileName);

        //   setFilePath(response);

        onChangeImage(response.uri, response);

        console.log(response);

        setbusy(false);

        // setIsVisible(false);
      });
    }
  };

  const takeImage = async () => {
    let options = {
      mediaType: 'photo',

      // maxWidth: 500,

      // maxHeight: 500,

      quality: 1,

      includeBase64: true,

      // videoQuality: 'low',

      // durationLimit: 30, //Video max duration in seconds

      saveToPhotos: true,
    };

    let isCameraPermitted = await requestCameraPermission();

    let isStoragePermitted = await requestExternalWritePermission();

    if (isCameraPermitted && isStoragePermitted) {
      launchCamera(options, response => {
        console.log('Response = ', response);

        if (response.didCancel) {
          // Alert.alert('User cancelled camera picker');

          return;
        } else if (response.errorCode === 'camera_unavailable') {
          Alert.alert('Camera not available on device');

          return;
        } else if (response.errorCode === 'permission') {
          Alert.alert('Permission not satisfied');

          return;
        } else if (response.errorCode === 'others') {
          Alert.alert(response.errorMessage);

          return;
        }

        console.log('base64 -> ', response.data);

        console.log('uri -> ', response.uri);

        console.log('width -> ', response.width);

        console.log('height -> ', response.height);

        console.log('fileSize -> ', response.fileSize);

        console.log('type -> ', response.type);

        console.log('fileName -> ', response.fileName);

        //   setFilePath(response);

        onChangeImage(response.uri, response);

        console.log(response);

        setbusy(false);

        // setIsVisible(false);
      });
    }
  };

  const handlePress = type => {
    if (!imageUri) {
      if (type == 'new') {
        takeImage();
      } else {
        selectImage();
      }
    } else
      Alert.alert('Delete', 'Are you sure you wnat to delete the image?', [
        {
          text: 'Yes',

          onPress: () => onChangeImage(null),
        },

        {text: 'No'},
      ]);
  };

  return (
    <View>
      <Modal
        isVisible={isVisible}
        style={styles.modalView}
        onBackdropPress={() => setIsVisible(!isVisible)}>
        <View style={styles.centeredView}>
          <View style={styles.cardView}>
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => setIsVisible(false)}>
              <Entypo
                name="cross"
                size={styles.iconSize}
                style={styles.iconStyles}
              />
            </TouchableOpacity>

            {image ? <Image source={image} style={styles.image} /> : null}

            <View style={styles.headContainer}>
              <Text>{title}</Text>

              <Text style={styles.subtitleText}>{subtitle}</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => takeImage()}>
                <Text>Take Image</Text>
                {/* <Entypo name="camera" size={25} color={color.background} /> */}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={() => selectImage()}>
                <Text>Select Image</Text>
                {/* <Entypo name="image" size={25} color={color.background} /> */}
              </TouchableOpacity>
            </View>

            {showPreview ? (
              <>
                <TouchableWithoutFeedback onPress={handlePress}>
                  <View style={[styles.container, style]}>
                    {!imageUri ? (
                      <Entypo color={color.icon} name="image" size={40} />
                    ) : (
                      <Image
                        source={{uri: imageUri}}
                        style={styles.imagePreview}
                      />
                    )}
                  </View>
                </TouchableWithoutFeedback>

                <Button
                  name={showPreview ? 'Upload' : 'Send'}
                  style={styles.saveButton}
                  disabled={!imageUri}
                  onPress={onPressUpload}
                />
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalView: {
    // backgroundColor: 'rgba(107, 114, 128, 1)',
    margin: 0,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardView: {
    paddingVertical: 20,
    backgroundColor: color.background,
    // width: (40),
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  headContainer: {
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  subtitleText: {
    color: color.text,
    // width: widthScaleSub(75),
    textAlign: 'center',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    justifyContent: 'space-between',
    // backgroundColor: 'red',
  },
  button: {
    flexDirection: 'row',
    width: '40%',
    backgroundColor: color.primary,
    marginVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
  },
  image: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 5,
  },
  container: {
    marginTop: 10,
    flexDirection: 'row',
    marginHorizontal: 15,
    // width: widthScaleSub(90),
    height: 150,
    borderRadius: 8,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreview: {
    height: 130,
    width: 120,
    resizeMode: 'contain',
  },
  saveButton: {
    width: 90,
  },
  iconSize: 20,
  iconStyles: {
    color: color.icon,
  },
  iconContainer: {
    alignSelf: 'flex-end',
  },
});
export default CameraModal;
