import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore as db } from "./firebase";
import QRCode from 'qrcode.react';
import { auth } from '../../src/components/firebase';

const Invite = () => {
  const location = useLocation();
  const inviteId = new URLSearchParams(location.search).get('ref');
  
  const [inviteData, setInviteData] = useState(null);
  const [hasDoc, setHasDoc] = useState(true);
  const [URL, setURL] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isManager, setIsManager] = useState(false);
  

  useEffect(() => {
    // Check if the user is authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchInviteData = async () => {
      try {
        const inviteDocRef = doc(db, 'invites', inviteId);
        const inviteSnapshot = await getDoc(inviteDocRef);

        if (inviteSnapshot.exists()) {
          // Document exists, set the data
          setInviteData({
            id: inviteSnapshot.id,
            ...inviteSnapshot.data(),
          });
          setURL(`https://privo.pages.dev/login?ref=${inviteData.id}`);
        } else {
          setHasDoc(false);
          console.log('Invite document not found');
        }
      } catch (error) {
        console.error('Error fetching invite data:', error);
      }
    };

    if (inviteId) {
      fetchInviteData();
    }
  }, [inviteId]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 h-screen bg-slate-200">
      {inviteData ? (
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center justify-center">
          <div className="mb-4 p-5">
            <QRCode value={URL} size={200} />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Invite Details</h2>
          <p className="mb-1">ID: {inviteData.id}</p>
          <p className="mb-1">Manager: {inviteData.manager}</p>
          <p className="mb-1">Team: {inviteData.team}</p>
          <p className="mb-1">Time: {inviteData.time.toDate().toString()}</p>
          <p className="mb-1">User: {inviteData.user}</p>
        </div>
      ) : hasDoc ?
          currentUser.id == inviteData.id ? (
              <p className="text-gray-600">Sorry, this invite isn't for you...</p>
            )
          : (
        <p className="text-gray-600">Loading invite data...</p>
      ) : (
        <p className="text-red-500">Invite does not exist!</p>
      )}
    </div>
  );
};

export default Invite;