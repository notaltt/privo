import { firestore as db } from './firebase';
import { arrayUnion, doc, updateDoc, setDoc } from 'firebase/firestore';

export async function pushNotifications(team, avatar, name, role, time, type, content) {
  const teamString = team.toString();
  const avatarString = avatar.toString();
  const nameString = name.toString();
  const roleString = role.toString();
  const timeString = time.toString();
  const typeString = type.toString();
  const contentString = content.toString();

  const notificationData = {
    team: teamString,
    avatar: avatarString,
    name: nameString,
    role: roleString,
    time: timeString,
    type: typeString,
    content: contentString,
  };

  const notificationsDocRef = doc(db, 'notifications', teamString);

  try {
    await updateDoc(notificationsDocRef, {
      notificationData: arrayUnion(notificationData),
    });
    console.log('Notification addedd successfully.');
  } catch (error) {
    console.error('Error adding notification: ', error);
  }
}
 