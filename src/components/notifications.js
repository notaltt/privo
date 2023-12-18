import { firestore as db} from './firebase';
import { collection, arrayUnion, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function pushNotifications(team, avatar, name, role, time, type, content, company) {
  const teamString = team.toString();
  const companyString = company.toString();

  const notificationData = {
    team: teamString,
    avatar: avatar.toString(),
    name: name.toString(),
    role: role.toString(),
    time: time.toString(),
    type: type.toString(),
    content: content.toString(),
  };

  const notificationsCollectionRef = collection(db, 'notifications');
  const notificationQuery = query(
    notificationsCollectionRef,
    where('teamName', '==', teamString),
    where('fromCompany', '==', companyString)
  );
  const querySnapshot = await getDocs(notificationQuery);

  try {
    const docSnapshot = doc(notificationsCollectionRef,  querySnapshot.docs[0].id);
    await updateDoc(docSnapshot, {
      notificationData: arrayUnion(notificationData),
    });
    console.log('Notification added successfully.');
  } catch (error) {
    console.error('Error adding notification: ', error);
  }
}
