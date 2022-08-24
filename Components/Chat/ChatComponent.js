/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ToastAndroid,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import {PRESENCE, User, UserPresense} from './models/user';
import {Message} from './models/message';
import {MessageType} from './models/message.type';
import {Image} from 'react-native';
// import '../../Services/poly';
import Entypo from 'react-native-vector-icons/Entypo';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Toast from 'react-native-simple-toast';
// Component Imports
import {
  ChatHeader,
  AppScreen,
  CustomModal,
  ImageInput,
  CameraModal,
  SmallText,
  AppLoading,
  GalleryModal,
  // ChatComponent,
} from 'components';

import moment from 'moment';

// import placeholderImage from 'assets/placeholders/profile-image.png';

// Styles Imports
import {color, font, heightScale, widthScale} from 'globalStyle';
import {SecondaryText} from '../AppText/SecondaryText';
import {message} from 'statuses';

import styles from './ChatComponentStyles';

import {IOS} from 'enums/Platform.js';

import LockIcon from 'assets/chat/lock.png';
import {Divider} from 'react-native-paper';
import {formatDateAndTime} from '../../Utilities/Helpers';

const ChatComponent = props => {
  const reasonForVisit =
    props && props.matrixCredentials ? props.matrixCredentials.reason : '';

  // Data States
  const [messageText, setMessageText] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryClose, setGalleryClose] = useState(false);
  const [disclaimer, setDisclaimer] = useState('');

  const [currentImage, setCurrentImage] = useState(null);

  // ScrolView Ref
  const scrollViewRef = useRef();

  // Height
  // Height
  const [heightInput, setHeightInput] = useState(38);
  const [viewHeight, setViewHeight] = useState(38);
  const [heightControl, setHeightControl] = useState(false);

  useEffect(() => {
    console.log('The View Height Increase', viewHeight);
    if (viewHeight > 115) {
      setViewHeight(viewHeight);
      setHeightInput(heightInput);
      setHeightControl(true);
    }
  }, [viewHeight]);

  // Image
  const imageSend = require('../../assets/chat/send.png');
  const [imageUpload, setImageUpload] = useState('');
  const [imageData, setImageData] = useState(null);

  // Modal States
  const [isVisible, setIsVisible] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);

  // Loading
  const [loading, setLoading] = useState(false);
  const image = require('../../assets/chat/end-visit-modal.png');

  /**@type {User} */
  let currentUser = props.currentUser;

  /**@type {Array<User>} */
  let users = props.users || [];

  /**@type {Array<Message>} */
  let messages = props.messages || [];

  // let messages = useMemo(() => props.messages || [], [props.messages]);

  /**@type {Array<UserPresense>} */
  let usersPresence = props.usersPresence || [];

  let onMessageSend = props.onMessageSend;

  let onImageMessageSend = props.onImageMessageSend;

  let onSendClick = props.onsSendClick;
  let onMicrophoneClick = props.onMicrophoneClick;

  const [messageList, setMessageList] = useState([]);
  const [myUser, setMyUser] = useState(new User());
  const [incommingUser, setIncommingUser] = useState(null);

  const messagesEndRef = useRef(null);

  const [text, setText] = useState('');

  const [render, setRender] = useState(false);

  const getIncomingUsers = () => {
    console.log('The Users', users);
    if (users && users.length === 0) {
      return [];
    }
    if (users == null) {
      return [];
    }
    if (currentUser == null) {
      return;
    }
    if (users && users.length > 0) {
      let incomming = users && users.filter(u => u.id !== currentUser.id);
      return incomming;
    }
    return [];
  };

  const getIncomingUser = () => {
    let users = getIncomingUsers();
    if (!users) {
      return;
    }
    if (users && users.length === 0) {
      return null;
    }
    console.log('The users in getIncoming User', users);
    // if (!users[0]) {
    //   return;
    // }
    let user = users[0];
    user.avatar = user.avatar || 'https://i.imgur.com/IAgGUYF.jpg';
    return user;
  };

  const getIncommingPresences = () => {
    let users = getIncomingUsers();
    if (users && users.length === 0) {
      return [];
    }
    let userIds = users.map(u => u.id);
    let presences = usersPresence.filter(up => userIds.includes(up.userId));
    return presences;
  };

  const getOnlineUsers = () => {
    let incommingPresences = getIncommingPresences();
    console.log('Online Presences Users', incommingPresences);
    let onlineUsers = incommingPresences.filter(
      ip => ip.status === PRESENCE.ONLINE,
    );
    return onlineUsers;
  };

  const getIsOnline = () => {
    let onlineUsers = getOnlineUsers();
    console.log('Online Users', onlineUsers);
    if (onlineUsers.length > 0) {
      return true;
    }

    return false;
  };

  const formatAMPM = date => {
    if (!date) {
      date = new Date();
    }
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  };

  useEffect(() => {
    setLoading(true);
    console.log('The Messages', messages);
    setMessageList(messages);
    // setLoading(false);
  }, [messages]);
  useEffect(() => {
    setLoading(false);
    if (messageList && messageList.length > 0) {
      const imageMessages = messageList.filter(
        message => message.messageType === 'IMAGE',
      );
      // console.log('The Image Messages', imageMessages);
      const chatImages = imageMessages.map(({url}) => url);
      // console.log('The Chat Images', chatImages);
      setGalleryImages(chatImages);
      setLoading(false);
      // setLoading(true);
      return;
    }
  }, [messageList]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    setMyUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (!users && users.length === 0) {
      return;
    }
    let incommingUser = getIncomingUser();
    setIncommingUser(incommingUser);
  }, [users]);

  useEffect(() => {
    // setLoading(true);
    if (!currentUser) {
      return;
    }
    if (!messages && messages.length === 0) {
      setLoading(false);
      return;
    }

    setRender(true);
  }, [currentUser, messages]);

  useEffect(() => {
    scrollToMessageEnd();
    getIsOnline();
  }, [messageList]);

  const handleTextSend = () => {
    if (text == '' && imageUpload == '') {
      if (Platform.OS === 'android') {
        return ToastAndroid.show(
          'Cannot send empty message !',
          ToastAndroid.SHORT,
        );
        // return Alert.alert('Cannot send empty message !');
      } else {
        return Alert.alert('Cannot send empty message !');
      }
    }
    if (imageUpload) {
      handleImageMessage();
      return;
    }
    let now = new Date();
    let message = new Message();
    message.message = text;
    // message.message = text.replace(/\s+/g, ' ').trim();
    message.from = myUser;
    message.datetime = now.toISOString();
    message.messageType = MessageType.TEXT;
    let messageList_ = [...messageList, message];

    setMessageList(messageList_);

    if (onMessageSend) {
      onMessageSend(message);
    }

    setText('');
    Keyboard.dismiss();
    setViewHeight(48);
  };

  const handleImageMessage = async () => {
    console.log('The Image Complete Data', imageData);
    let now = new Date();
    let message = new Message();
    message.message = text;
    message.from = myUser;
    message.datetime = now.toISOString();
    message.filename = imageData.fileName;
    message.height = imageData.height;
    message.width = imageData.width;
    message.mimetype = imageData.type;
    message.size = imageData.fileSize;
    const res = await props.uploadImage(imageData);
    message.url = res.content_uri;
    message.messageType = MessageType.IMAGE;
    console.log('Message', message);
    let messageList_ = [...messageList, message];

    setMessageList(messageList_);

    if (onImageMessageSend) {
      onImageMessageSend(message);
    }

    setText('');
    setImageData(null);
    setImageUpload('');
    Keyboard.dismiss();
  };

  const handleTextChange = text => {
    let val = text;
    setText(val);
  };

  const handleMicrophoneClick = () => {
    if (onMicrophoneClick) {
      onMicrophoneClick();
    }
  };

  const scrollToMessageEnd = () => {
    messagesEndRef.current?.scrollToEnd({animated: true, index: -1}, 200);
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      handleTextSend();
    }
  };

  const formatUserMessage = msg => {
    let dt = new Date(msg.datetime);
    let timeAmPm = formatAMPM(dt);

    return (
      <View key={msg.id} style={styles.senderMain}>
        <View style={styles.sender}>
          <SmallText style={styles.senderText}>{msg.message}</SmallText>
        </View>
        <SmallText style={styles.messageSenderTime}>
          {timeAmPm}{' '}
          <SecondaryText style={styles.messageSenderTime}>
            {msg.read ? 'Read' : 'Unread'}
          </SecondaryText>
        </SmallText>
      </View>
    );
  };

  const formatIncomingMessage = msg => {
    let dt = new Date(msg.datetime);
    let timeAmPm = formatAMPM(dt);

    let user = msg.from;
    let avatar = (user && user.avatar) || 'https://i.imgur.com/IAgGUYF.jpg';

    return (
      <View key={msg.id} style={styles.recieverMain}>
        <View style={styles.reciever}>
          <SmallText style={styles.recieverText}>{msg.message}</SmallText>
        </View>
        <SmallText style={styles.messageRecieverTime}>{timeAmPm}</SmallText>
      </View>
    );
  };

  const formatIncomingImageMessage = msg => {
    let dt = new Date(msg.datetime);
    let timeAmPm = formatAMPM(dt);

    let user = msg.from;
    let avatar = (user && user.avatar) || 'https://i.imgur.com/IAgGUYF.jpg';

    return (
      <TouchableOpacity
        key={msg.id}
        style={styles.recieverMain}
        onPress={() => setGalleryClose(true)}>
        <View style={styles.reciever}>
          <View>
            <Image source={{uri: msg.url}} style={styles.messageImage} />
          </View>

          <SmallText style={styles.recieverText}>{msg.message}</SmallText>
        </View>
        <SmallText style={styles.messageRecieverTime}>{timeAmPm}</SmallText>
      </TouchableOpacity>
    );
  };

  // const getCorrentUrl = msg => {
  //   if (msg && msg !== null) {
  //     if (msg.url) {
  //       if (msg.url.startsWith('https://')) {
  //         return msg.url;
  //       } else {
  //         let msgNewUrl = msg.url.substring(5, msg.length - 1);
  //         let staticUrl =
  //           'https://chat.instacured.io/_matrix/media/r0/download/';
  //         const url = staticUrl + msgNewUrl;
  //         console.log('The Updated Url', url);
  //         return url;
  //       }
  //     }
  //   }
  // };

  const formatUserImageMessage = msg => {
    let dt = new Date(msg.datetime);
    let timeAmPm = formatAMPM(dt);
    // let urlUpdated = getCorrentUrl(msg);
    let user = msg.from;
    let avatar = (user && user.avatar) || 'https://i.imgur.com/IAgGUYF.jpg';
    return (
      <TouchableOpacity
        key={msg.id}
        style={styles.senderMain}
        onPress={() => {
          setGalleryClose(true);
          setCurrentImage(msg.url);
        }}>
        <View style={styles.sender}>
          <View>
            <Image
              source={{
                uri: msg.url,
              }}
              style={styles.messageImage}
            />
          </View>

          <SmallText style={styles.senderText}>{msg.message}</SmallText>
        </View>
        <SmallText style={styles.messageSenderTime}>{timeAmPm}</SmallText>
      </TouchableOpacity>
    );
  };

  const formatInfoMessage = msg => {
    return (
      <View key={msg.id} style={styles.senderMain}>
        <View style={styles.sender}>
          <SmallText style={styles.senderText}>{msg.message}</SmallText>
        </View>
      </View>
    );
  };

  const formatMessage = msg => {
    let messageUI = null;
    switch (msg.messageType) {
      case MessageType.TEXT:
        if (msg.from.id === myUser.id) {
          messageUI = formatUserMessage(msg);
        } else {
          messageUI = formatIncomingMessage(msg);
        }
        break;
      case MessageType.INFO:
        console.log('got info message: ', msg);
        messageUI = formatInfoMessage(msg);
        break;

      case MessageType.IMAGE:
        if (msg.from.id === myUser.id) {
          messageUI = formatUserImageMessage(msg);
        } else {
          messageUI = formatIncomingImageMessage(msg);
        }
        break;
      default:
        return;
    }

    return messageUI;
  };

  //   const renderOnlineStatus = () => {
  //     let classNames =
  //       'ml-2 mt-1 rounded-full h-2.5 w-2.5 flex items-center justify-center...';
  //     if (getIsOnline()) {
  //       classNames += ' bg-yellow-700';
  //     } else {
  //       classNames += ' bg-yellow-400';
  //     }

  //     return <div className={classNames}></div>;
  //   };

  // useEffect(() => {
  //   console.log("The Image Uplaod", props.image)
  // }, []);
  useEffect(() => {
    if (disclaimer && disclaimer !== '') {
      return setTimeout(() => {
        setDisclaimer('');
      }, 10000);
    }
  }, [disclaimer]);

  useEffect(() => {
    if (props.chatClosed) {
      setDisclaimer('This visit has ended. You can no longer send messages');
    }
  }, []);

  return (
    // <>
    //   {loading && messageList.length === 0 ? (
    //     <AppLoading message={'Almost done !'} />
    //   ) : messageList.length === 0 ? (
    //     <>
    //       {render && messageList.length === 0 ? (
    //         <View
    //           style={[
    //             styles.screen,
    //             { flex: 1, justifyContent: 'center', alignItems: 'center' },
    //           ]}
    //         >
    //           <SmallText style={{ color: color.icon }}>No Messages !</SmallText>
    //         </View>
    //       ) : render ? null : (
    //         <AppLoading message={'Please wait we are initializing your chat'} />
    //       )}
    //     </>
    // <>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}
      keyboardVerticalOffset={20}>
      {loading && messageList.length === 0 ? (
        <AppLoading message={'Almost done !'} />
      ) : messageList.length === 0 ? (
        <>
          {render && messageList.length === 0 ? (
            <View style={[styles.screen, {flex: 1}]}>
              <View style={styles.encryptionBox}>
                <Image source={LockIcon} style={styles.lockIcon} />
                <SecondaryText style={styles.encryptionText}>
                  Messages are end-to-end encrypted
                </SecondaryText>
              </View>
              <View style={styles.DateBox}>
                <Divider style={styles.dividerDate} />
                <SecondaryText style={styles.dateText}>
                  Start Date:{' '}
                  {formatDateAndTime(
                    props?.matrixCredentials?.visit?.startedAt,
                  )}
                  {/* {moment(props?.matrixCredentials?.visit?.startedAt).format(
                    'MM-DD-YYYY',
                  )} */}
                </SecondaryText>
                <Divider style={styles.dividerDate} />
              </View>
              <View style={styles.reasonView}>
                <View style={styles.reasonContentView}>
                  <SmallText
                    style={[
                      styles.reasonForVisitText,
                      {fontFamily: font.one.medium},
                    ]}>
                    Reason for Visit:
                  </SmallText>
                  <SmallText style={styles.reasonForVisitText}>
                    {reasonForVisit}
                  </SmallText>
                </View>
              </View>
              {props.matrixCredentials?.visit?.status == 'Inprogress' ? null : (
                <View style={styles.DateBox}>
                  <Divider style={styles.dividerDate} />
                  <SecondaryText style={styles.dateText}>
                    End Date:{' '}
                    {formatDateAndTime(
                      props?.matrixCredentials?.visit?.endedAt,
                    )}
                  </SecondaryText>
                  <Divider style={styles.dividerDate} />
                </View>
              )}
              <View style={styles.emptyChatView}>
                <SmallText style={{color: color.textLight}}>
                  {/* No Messages ! */}
                </SmallText>
              </View>
            </View>
          ) : render ? null : (
            <AppLoading message={'Please wait we are initializing your chat'} />
          )}
        </>
      ) : (
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[styles.containerStyle, {flexGrow: 1}]}
          ref={messagesEndRef}
          onContentSizeChange={(contentWidth, contentHeight) => {
            scrollToMessageEnd();
          }}>
          <View style={styles.encryptionBox}>
            <Image source={LockIcon} style={styles.lockIcon} />
            <SecondaryText style={styles.encryptionText}>
              Messages are end-to-end encrypted
            </SecondaryText>
          </View>

          {/* <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          > */}
          <View style={styles.DateBox}>
            <Divider style={styles.dividerDate} />
            <SecondaryText style={styles.dateText}>
              Start Date:{' '}
              {formatDateAndTime(props?.matrixCredentials?.visit?.startedAt)}
            </SecondaryText>
            <Divider style={styles.dividerDate} />
          </View>
          <View style={styles.reasonView}>
            <View style={styles.reasonContentView}>
              <SmallText
                style={[
                  styles.reasonForVisitText,
                  {fontFamily: font.one.bold},
                ]}>
                Reason for Visit:
              </SmallText>
              <SmallText style={styles.reasonForVisitText}>
                {reasonForVisit}
              </SmallText>
            </View>
          </View>
          {render &&
            messageList.map((message, i) => (
              <View key={i}>{formatMessage(message)}</View>
            ))}
          {/* </KeyboardAvoidingView> */}
          {props.matrixCredentials?.visit?.status == 'Inprogress' ? null : (
            <View style={styles.DateBox}>
              <Divider style={styles.dividerDate} />
              <SecondaryText style={styles.dateText}>
                End Date:{' '}
                {formatDateAndTime(props?.matrixCredentials?.visit?.endedAt)}
              </SecondaryText>
              <Divider style={styles.dividerDate} />
            </View>
          )}
        </ScrollView>
      )}

      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        // style={{ marginBottom: 100 }}
      >
        <View style={styles.inputMainView}>
          {imageUpload ? (
            <View
              style={[
                styles.ImagePreviewContainer,
                {marginBottom: heightInput - 20, left: widthScale(25)},
              ]}>
              <View style={styles.preview}>
                <TouchableOpacity
                  onPress={() => setImageUpload('')}
                  style={styles.cancelImageIcon}>
                  <Entypo
                    color={color.basic}
                    name="cross"
                    size={heightScale(22)}
                  />
                </TouchableOpacity>
                <Image
                  source={{uri: imageUpload}}
                  style={styles.imagePreview}
                />
              </View>
            </View>
          ) : null}
          {disclaimer ? (
            <SecondaryText
              style={{
                height: 70,
                paddingHorizontal: widthScale(30),
                backgroundColor: color.white,
              }}>
              {disclaimer}
            </SecondaryText>
          ) : null}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              // backgroundColor: 'yellow',
              alignItems: 'center',
              paddingTop: heightScale(10),
              marginBottom: heightScale(15),
            }}>
            <TouchableOpacity
              onPress={() => setIsCameraVisible(true)}
              style={styles.camerIconCaontainer}
              disabled={props.chatClosed}>
              <SimpleLineIcons
                name="plus"
                size={heightScale(20)}
                color={color.icon}
              />
            </TouchableOpacity>
            <View
              style={[
                styles.inputTextContainer,
                {
                  borderRadius: heightScale(8),
                  // backgroundColor: 'red',
                  // height: heightScale(viewHeight),
                  // height
                },
              ]}>
              <View
                style={[
                  styles.textInputContainer,
                  {
                    height: viewHeight,
                    minHeight: Platform.OS === IOS && 5 ? 1.25 * 40 : null,
                  },
                ]}>
                {props.chatClosed ? (
                  <TouchableOpacity
                    style={{width: '90%'}}
                    onPress={() => {
                      // Alert.alert('Disclamier');
                      setDisclaimer(
                        'This visit has ended. You can no longer send messages',
                      );
                    }}>
                    <TextInput
                      placeholder="Type a message"
                      style={[styles.textInput, {height: heightInput}]}
                      placeholderTextColor={color.icon}
                      value={text}
                      multiline={true}
                      onChangeText={text => handleTextChange(text)}
                      onContentSizeChange={event => {
                        setHeightInput(event.nativeEvent.contentSize.height);
                        setViewHeight(event.nativeEvent.contentSize.height);
                      }}
                      editable={!props.chatClosed}
                    />
                  </TouchableOpacity>
                ) : (
                  <TextInput
                    placeholder="Type a message"
                    style={[styles.textInput, {height: heightInput}]}
                    placeholderTextColor={color.icon}
                    value={text}
                    // numberOfLines={5}
                    numberOfLines={Platform.OS === IOS ? null : 5}
                    minHeight={Platform.OS === IOS && 5 ? 7 * 5 : null}
                    multiline={true}
                    onChangeText={text => handleTextChange(text)}
                    onContentSizeChange={event => {
                      if (!heightControl) {
                        setHeightInput(event.nativeEvent.contentSize.height);
                        setViewHeight(event.nativeEvent.contentSize.height);
                        return;
                      }
                      if (text == '') {
                        console.log(
                          'The Height',
                          event.nativeEvent.contentSize.height,
                        );
                        // setHeightInput(event.nativeEvent.contentSize.height);
                        setHeightControl(false);
                        setViewHeight(48);
                        setHeightInput(48);
                      }
                    }}
                    editable={!props.chatClosed}
                  />
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleTextSend()}
              disabled={props.chatClosed}>
              <Image source={imageSend} style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
      {props.chatClosed ? null : (
        <CameraModal
          title={'Choose or upload'}
          subtitle={'Take a picture or upload image from gallery.'}
          isVisible={isCameraVisible}
          setIsVisible={visible => setIsCameraVisible(visible)}
          imageUri={imageUpload}
          onChangeImage={(image, data) => {
            setImageUpload(image);
            setImageData(data);
            setIsCameraVisible(false);
          }}
        />
      )}
      <GalleryModal
        isVisible={galleryClose}
        images={galleryImages}
        onPressClose={() => setGalleryClose(false)}
        currentImage={currentImage}
      />
    </KeyboardAvoidingView>
  );
};

export default ChatComponent;
