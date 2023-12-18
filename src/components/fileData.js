import { firestore as db } from './firebase';
import { arrayUnion, doc, updateDoc, arrayRemove, query, where, getDocs, collection } from 'firebase/firestore';

export async function addToFirestore(fileName, path, team, company){
    const nameString = fileName.toString();
    const pathString = path.toString();
    const teamString = team.toString();
    const companyString = company.toString();

    const fileData = {
        fileName: nameString,
        path: pathString,
        team: teamString
    }

    const fileDataRef = collection(db, 'files');
    const fileQuery = query(fileDataRef, 
      where('teamName', '==', teamString), 
      where('fromCompany', '==', companyString));
    const querySnapshot = await getDocs(fileQuery)

    try{
      const fileSnapshot = doc(fileDataRef, querySnapshot.docs[0].id);
      await updateDoc(fileSnapshot, {
        fileData: arrayUnion(fileData),
    });
    } catch(error){
        console.log(error);
    }
}

export async function deleteFromFirestore(fileName, path, team, company) {
    const nameString = fileName.toString();
    const teamString = team.toString();
    const pathString = path.toString();
    const companyString = company.toString();
  
    const fileData = {
      fileName: nameString,
      path: pathString,
      team: teamString,
    };
  
    const fileDataRef = collection(db, 'files');
    const fileQuery = query(fileDataRef, 
      where('teamName', '==', teamString), 
      where('fromCompany', '==', companyString));
    const querySnapshot = await getDocs(fileQuery)

    try{
      const fileSnapshot = doc(fileDataRef, querySnapshot.docs[0].id);
      await updateDoc(fileSnapshot, {
        fileData: arrayRemove(fileData),
    });
    } catch(error){
        console.log(error);
    }
}