import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore as db } from "./firebase";

const Invite = () => {
  const location = useLocation();
  const inviteId = new URLSearchParams(location.search).get('ref');

  const [inviteData, setInviteData] = useState(null);

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
        } else {
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
    <div>
      {inviteData ? (
        <div>
          <h2>Invite Details</h2>
          <p>ID: {inviteData.id}</p>
          <p>Manager: {inviteData.manager}</p>
          <p>Team: {inviteData.team}</p>
          <p>Time: {inviteData.time.toDate().toString()}</p>
          <p>User: {inviteData.user}</p>
        </div>
      ) : (
        <p>Loading invite data...</p>
      )}
    </div>
  );
};

export default Invite;