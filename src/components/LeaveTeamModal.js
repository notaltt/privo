import React from 'react';
import { useLocation } from 'react-router-dom';
import { firestore as db } from "./firebase";
import { collection, getDocs, where, query, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const LeaveTeamModal = ({ user, team, isOpen, closeModal }) => {
    const leaveTeam = async () => {
        try {
          const teamCollection = collection(db, 'team');
          const teamDoc = doc(teamCollection, team);
      
          const userCollection = collection(db, 'users');
          const userQuery = query(userCollection, where('email', '==', user));
          const userSnapshot = await getDocs(userQuery);
      
          const currentTeams = userSnapshot.docs[0].data().teams || [];
          
          const teamSnapshot = await getDoc(teamDoc);
          const currentMembers = teamSnapshot.data().members || [];
      
          // Remove the team from the user's teams
          const updatedTeams = currentTeams.filter(teamName  => teamName !== team);
          const userDoc = doc(userCollection, userSnapshot.docs[0].id);
          await updateDoc(userDoc, { teams: updatedTeams });
      
          // Remove the user from the team's members
          const updatedMembers = currentMembers.filter(member => member !== user);
          await updateDoc(teamDoc, { members: updatedMembers });
      
          navigateToFiles();
          
        } catch (error) {
          console.error('Error leaving team:', error);
        }
    };

    const location = useLocation();
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
    isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" >
        <div className="absolute inset-0 bg-black opacity-80" onClick={closeModal}></div>
        <div className="bg-white rounded-md shadow-md p-6 z-10">
            <h2 className="text-xl font-semibold mb-4">Leave Team</h2>
            <p className="m-6">{`Are you sure you want to leave team ${team}, ${user}?`}</p>

            <div className="flex justify-end space-x-4">
                <button
                    className="px-4 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                    onClick={leaveTeam}
                >
                    Leave
                </button>
                <button
                    className="px-4 py-1 text-white bg-gray-500 rounded hover:bg-gray-600"
                    onClick={closeModal}
                >
                    Cancel
                </button>
            </div>
        </div>
        </div>)
  );
};

export default LeaveTeamModal;
