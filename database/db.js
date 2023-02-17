import firestore from '@react-native-firebase/firestore';

export const addUserToDatabase = user => {
  firestore()
    .collection('Users')
    .add(user)
    .then(res => {
      console.log(`User added! ${JSON.stringify(user)}`);
    });
};

export const updateUserInDatabase = user => {
  firestore()
    .collection('Users')
    .doc(user.id)
    .update(user)
    .then(() => {
      console.log(`User updated! ${JSON.stringify(user)}`);
    });
};

export const getAllUsersFromDatabase = async () => {
  const users = await firestore().collection('Users').get();
  const extractUsers = users.docs.map(doc => {
    return {...doc.data(), id: doc.id};
  });
  console.log('Users from database,', extractUsers);
  return extractUsers;
};

export const getUserFromDatabase = async id => {
  const user = await firestore().collection('Users').doc(id).get();
  const extractUser = {...user.data(), id: user.id};
  console.log('User from database', extractUser);
  return extractUser;
};

// Live Changes
function onResult(QuerySnapshot) {
  console.log('Got Users collection result.');
}

function onError(error) {
  console.error(error);
}

firestore().collection('Users').onSnapshot(onResult, onError);
