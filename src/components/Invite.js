import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { firestore as db } from "./firebase";
import { collection, getDocs, where, query, doc, getDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import QRCode from 'qrcode.react';
import { auth } from '../../src/components/firebase';
import { useNavigate } from 'react-router-dom';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import { pushNotifications } from './notifications';

const Invite = ({ code, className }) => {
  const location = useLocation();
  const param = new URLSearchParams(location.search).get('ref');
  const inviteId = code || param || 'invalid';
  
  const [inviteData, setInviteData] = useState(null);
  const [hasDoc, setHasDoc] = useState(true);
  const [URL, setURL] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeDifference, setTimeDifference] = useState({minutes:0, seconds:-1});
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        console.log(`user:${'\t'.repeat(3)}` + user.uid);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const inviteDocRef = doc(db, 'invites', inviteId);

    const unsubscribe = onSnapshot(inviteDocRef, async (docSnapshot) => {
      const inviteDocSnapshot = await getDoc(inviteDocRef);
  
      if (inviteDocSnapshot.exists()) {
        const updatedInviteData = docSnapshot.data();
        setInviteData(updatedInviteData);
      }
    });
  
    return () => unsubscribe();
  }, [inviteId, setIsExpired]);

  useEffect(() => {
    const deleteThisShit = async () => {
      const inviteDocRef = doc(db, 'invites', inviteId || '');

      await deleteDoc(inviteDocRef);
      setIsExpired(true);
      console.log(`Invite with ID ${inviteId} deleted.`);
    };

    const intervalId = setInterval(() => {
      const currentTime = new Date();
      let t = currentTime;

      if (inviteData) {
        t = inviteData.time.toDate();
      }

      const minutesDifference = differenceInMinutes(currentTime, t);
      const secondsDifference = differenceInSeconds(currentTime, t) % 60;

      if (minutesDifference === 60) deleteThisShit();

      setTimeDifference({
        minutes: minutesDifference,
        seconds: secondsDifference,
      });

    }, 1000);

    return () => {
      // Cleanup function to clear the interval when the component unmounts
      clearInterval(intervalId);
    };
  }, [inviteData, inviteId]);

  useEffect(() => {
    const checkUserRole = async (user) => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
    
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          const userRole = userData.role;
          const userName = userData.name;
          setUserRole(userRole);
          setUserName(userName);
            if (userRole === "manager")
              setIsManager(true);
            else if(userRole === "member")
              setIsManager(false);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    };
    
    if(currentUser)
      checkUserRole(currentUser);

    return () => {};
  }, [currentUser]);

  useEffect(() => {
    const fetchInviteData = async () => {
      try {
        const inviteDocRef = doc(db, 'invites', inviteId);
        const inviteSnapshot = await getDoc(inviteDocRef);
  
        if (inviteSnapshot.exists()) {
          const newInviteData = {
            id: inviteSnapshot.id,
            ...inviteSnapshot.data(),
          };
          setInviteData(newInviteData);
          setURL(`https://privo.pages.dev/login?ref=${newInviteData.id}`);
          console.log('invite data:\t' + newInviteData.user);
        } else {
          setHasDoc(false);
          console.log('Invite document not found');
        }
      } catch (error) {
        console.error('Error fetching invite data:', error);
      }
    };
  
    if (inviteId)
      fetchInviteData();
  
    return () => {};
  }, [inviteId, isExpired]);

  useEffect(() => {
    const checkInvite = async () => {
      try {
        const inviteDocRef = doc(db, 'invites', inviteId);
        const thresholdTime = new Date(Date.now() - 60 * 60 * 1000);

        if (inviteData && inviteData.time.toDate() < thresholdTime) {
          // Delete the invite entry if it exceeds 1 hour
          await deleteDoc(inviteDocRef);
          setIsExpired(true);
          console.log(`Invite with ID ${inviteId} deleted.`);
        }
      } catch (error) {
        console.error('Error fetching invite data:', error);
      }
    }

    if (inviteData && inviteId)
      checkInvite();
  
    return () => {};
  }, [inviteData, inviteId]);

  const addUserToTeam = async () => {
    setLoading(true);

    const currentLoggedEmail = auth.currentUser.email;
    const teamInvitation = inviteData.team;
    console.log(teamInvitation);

    try {
        const teamCollection = collection(db, 'team');
        const teamQuery = query(teamCollection, where('teamName', 'array-contains-any', teamInvitation), where('fromCompany', '==', inviteData.company))
        const docSnapshot = await getDocs(teamQuery);

        const userCollection = collection(db, 'users');
        const userQuery = query(userCollection, where('email', '==', currentLoggedEmail));
        const userSnapshot = await getDocs(userQuery);

        const currentTeams = userSnapshot.docs[0].data().teams || [];

        const currentMembers = docSnapshot.docs[0].data().members || [];

        if (!currentTeams.includes(teamInvitation.toString())) {
            currentTeams.push(teamInvitation.toString());

            const userDoc = doc(userCollection, userSnapshot.docs[0].id);
            await updateDoc(userDoc, { teams: currentTeams });
        } else {
            console.log(`${teamInvitation} is already a team of ${currentLoggedEmail}.`);
        }

        if (!currentMembers.includes(currentLoggedEmail)) {
            currentMembers.push(currentLoggedEmail);

            const teamDoc = doc(teamCollection, docSnapshot.docs[0].id);
            await updateDoc(teamDoc, {
                members: currentMembers,
            });
        } else {
            console.log(`${currentLoggedEmail} is already a member of ${teamInvitation}.`);
        }

        const notificationData = {
          time: new Date(),
          type: "team",
          content: "joined team",
        };

        pushNotifications(teamInvitation, '', userName, userRole, notificationData.time, notificationData.type, notificationData.content, inviteData.company);

        navigateToFiles();

    } catch (error) {
        console.error('Error adding member:', error);
    }
};


  const navigate = useNavigate();
  const navigateToFiles = () => {
    const targetPath = '/files';
    if (location.pathname === targetPath){
      console.log('refreshing');
      window.location.reload();
    }
    else{
      console.log(location);
      navigate(targetPath);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 bg-slate-200 ${className || 'h-screen'}`}>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        {inviteData && !isExpired ?
            currentUser.uid === inviteData.user || isManager? (
              <div className='flex flex-col items-center justify-center'>
                <h2 className="text-4xl font-semibold mb-2">{isManager ? 'Invite Details'  : 'You have been invited!'}</h2>
                <QRCode value={URL} size={200} className="m-7"/>
                <p className="mb-1 text-gray-600">Code ref: <span className='underline'>{inviteId}</span></p>
                <p className="mb-3 text-gray-600">User ref: {inviteData.user}</p>
                <p>Manager: {inviteData.manager}</p>
                <p>Team: {inviteData.team}</p>
                {timeDifference['seconds'] !== -1 &&
                <p className="mb-3">
                  {timeDifference['minutes'] > 0 && `${timeDifference['minutes']} minute${timeDifference['minutes'] > 1 ? 's' : ''} `}
                  {timeDifference['seconds']} second{timeDifference['seconds'] !== 1 && 's'} ago.
                </p>}
                {currentUser.uid === inviteData.user ?
                <button onClick={addUserToTeam} className="m-4 px-4 py-2 bg-blue-500 text-white rounded-md">Join Team {inviteData.team}</button> : <div/>}
                <div className = {loading ? "animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid m-2" : ''}></div>
              </div>
            ): (
              <p className="text-gray-800">Sorry, this invite isn't for you...</p>
          ): (
            <p className="text-gray-800">{hasDoc ?
              'Loading invite data...' : isExpired ?
              'Sorry, this invite is expired.' : 'Invite does not exist!'}</p>
      )}
      </div>
    </div>
  );

};

export default Invite;