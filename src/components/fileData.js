import { firestore as db } from './firebase';
import { arrayUnion, doc, updateDoc, arrayRemove } from 'firebase/firestore';

export async function addToFirestore(fileName, path, team){
    const nameString = fileName.toString();
    const pathString = path.toString();
    const teamString = team.toString();

    const fileData = {
        fileName: nameString,
        path: pathString,
        team: teamString
    }

    const fileDataRef = doc(db, 'files', teamString);

    try{
        await updateDoc(fileDataRef, {
            fileData: arrayUnion(fileData),
        });
    } catch(error){
        console.log(error);
    }
}

export async function deleteFromFirestore(fileName, path, team) {
    const nameString = fileName.toString();
    const pathString = path.toString();
    const teamString = team.toString();
  
    const fileData = {
      fileName: nameString,
      path: pathString,
      team: teamString,
    };
  
    const fileDataRef = doc(db, 'files', fileData.team);
  
    try {
      await updateDoc(fileDataRef, {
        fileData: arrayRemove(fileData),
      });
      console.log('Document successfully deleted!');
    } catch (error) {
      console.error('Error deleting document: ', error);
    }
}