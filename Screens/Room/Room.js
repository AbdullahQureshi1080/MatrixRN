import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  StatusBar,
  TextInput,
} from 'react-native';
import React, {useEffect, useState} from 'react';

import Screen from '../../Components/Screen/Screen';
import newStyles from './RoomStyles';

// import {useHeaderHeight} from '@react-navigation/stack';

// import {useTimeline} from '@rn-matrix/core';
import {MessageList, MessageItem} from '@rn-matrix/ui';

import Button from '../../Components/Button/Button';

export default function Room({route, navigation}) {
  const {room} = route.params;
  if (!room) navigation.goBack();
  useEffect(() => {
    console.log('ROOM', room);
  }, []);

  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode);

  // const headerHeight = useHeaderHeight();

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const onLongPress = message => {
    setSelectedMessage(message);
    setActionSheetVisible(true);
  };

  const onSwipe = message => {
    setSelectedMessage(message);
    setIsReplying(true);
  };

  const onEndEdit = () => {
    setIsEditing(null);
    setSelectedMessage(null);
  };

  const onCancelReply = () => {
    setIsReplying(null);
    setSelectedMessage(null);
  };

  const editMessage = () => {
    setActionSheetVisible(false);
    setIsEditing(true);
  };

  return (
    <Screen>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text>Back</Text>
      </TouchableOpacity>
      <Text style={styles.SCREEN_TITLE}>Room</Text>
      <MessageList
        room={room}
        keyboardOffset={StatusBar.currentHeight}
        enableComposer
        enableReplies
        showReactions
        selectedMessage={selectedMessage}
        isEditing={isEditing}
        isReplying={isReplying}
        onSwipe={onSwipe}
        onLongPress={onLongPress}
        onEndEdit={onEndEdit}
        onCancelReply={onCancelReply}
      />
      <View style={styles.INPUT_BOX}>
        <TextInput
          style={styles.INPUT}
          placeholder="Email"
          onChangeText={text => {
            userDispatch({type: 'SET_PASSWORD', payload: text});
          }}
          name="password"
        />
        <Button name={'Send'} size={'SMALL'} />
      </View>
      {/* <FlatList
        inverted
        data={timeline}
        renderItem={renderMessageItem}
        keyExtractor={item => item.getId()}
      /> */}
    </Screen>
  );
}
