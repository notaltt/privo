import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { firestore as db } from "./firebase";
import { collection, getDocs, where, query, doc, getDoc, updateDoc } from "firebase/firestore";
import QRCode from 'qrcode.react';
import { auth } from '../../src/components/firebase';
import { useNavigate } from 'react-router-dom';

const Invite = () => {
  const location = useLocation();
  const inviteId = new URLSearchParams(location.search).get('ref');
  
  const [inviteData, setInviteData] = useState(null);
  const [hasDoc, setHasDoc] = useState(true);
  const [URL, setURL] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(false);

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
    const checkUserRole = async (user) => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
    
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          const userRole = userData.role;
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
  }, [inviteId]);

  const addUserToTeam = async () => {
    setLoading(true);

    const currentLoggedEmail = auth.currentUser.email;
    const teamInvitation = inviteData.team;

    try {
        const teamCollection = collection(db, 'team');
        const teamDoc = doc(teamCollection, teamInvitation);
    
        const userCollection = collection(db, 'users');
        const userQuery = query(userCollection, where('email', '==', currentLoggedEmail));
        const userSnapshot = await getDocs(userQuery);
    
        const currentTeams = userSnapshot.docs[0].data().teams || [];
    
        const docSnapshot = await getDoc(teamDoc);
        const currentMembers = docSnapshot.data().members || [];
    
        currentMembers.push(currentLoggedEmail);
    
        await updateDoc(teamDoc, {
        members: currentMembers,
        });
    
        currentTeams.push(teamInvitation);
        const userDoc = doc(userCollection, userSnapshot.docs[0].id);
        await updateDoc(userDoc, { teams: currentTeams });

        navigateToTeams();
    
    } catch (error) {
        console.error('Error adding member:', error);
    }
  };

  const navigate = useNavigate();
  const navigateToTeams = () => { navigate('/teams'); };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 h-screen bg-slate-200">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        {inviteData ?
          hasDoc ?
            currentUser.uid === inviteData.user || isManager? (
              <div className='flex flex-col items-center justify-center'>
                <h2 className="text-4xl font-semibold mb-2">{isManager ? 'Invite Details'  : 'You have been invited!'}</h2>
                <div className="mb-4 p-5">
                  <QRCode value={URL} size={200} />
                </div>
                <p className="mb-1">ID: {inviteData.id}</p>
                <p className="mb-1">Manager: {inviteData.manager}</p>
                <p className="mb-1">Team: {inviteData.team}</p>
                <p className="mb-1">Time: {inviteData.time.toDate().toString()}</p>
                <p className="mb-1">User: {inviteData.user}</p>
                {currentUser.uid === inviteData.user ?
                <button onClick={addUserToTeam} className="m-4 px-4 py-2 bg-blue-500 text-white rounded-md">Join Team {inviteData.team}</button> : <div/>}
                <div className = {loading ? "animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid m-2" : ''}></div>
              </div>
                ): (
                  <p className="text-gray-800">Sorry, this invite isn't for you...</p>
                  ) : (
            <p className="text-red-500">Invite does not exist!</p>
            ) : (
              <p className="text-gray-800">Loading invite data...</p>
          )
        }
      </div>
    </div>
  );

};

export default Invite;