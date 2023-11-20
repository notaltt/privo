import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore as db } from '../components/firebase';

export const getUserDataByUid = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      return userSnapshot.data();
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user data: ', error);
    return null;
  }
};

export const updateUserDataByUid = async (uid, newData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, newData);
  } catch (error) {
    console.error('Error updating user data: ', error);
    throw error;
  }
};
