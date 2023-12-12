import SideBar from "./SideBar";
import Profile from "./Profile-Menu";
import DarkMode from "./DarkMode";
import React, { useEffect, useState } from "react";
import { firestore as db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, where, query, doc, updateDoc, getDoc, addDoc, writeBatch } from "firebase/firestore";
import { auth } from '../../src/components/firebase';
import { pushNotifications } from './notifications';
import FileList from './FileList';
import { Toaster, toast } from 'sonner'
import QRCode from 'qrcode.react';
import teamLogo from '../images/user-group.svg';
import ChangeTeamPhoto from "./ChangeTeamPhoto";

export default function Team() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showTeam, setshowTeam] = useState(true);
  const [teams, setTeams] = useState();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [member, setMember] = useState();
  const [users, setUsers] = useState();
  const [selectedUser, setSelectedUser] = useState("");
  const [isErrorModalOpen, setisErrorModalOpen] = useState(false);
  const [ErrorModalMessage, setErrorModalMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [openMembers, setOpenMembers] = useState(false);
  const [manageMembers, setManageMembers] = useState(false);
  const [showChangePhoto, setShowChangePhoto] = useState(false);

  useEffect(() => {
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
    const fetchUserData = async (user) => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
    
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setCurrentUserData(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    if(currentUser)
      fetchUserData(currentUser);

    return () => {};
  }, [currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (currentUserData.role === 'manager') {
          await checkInvites();
          await fetchUsers();
          await fetchTeams();
        } else {
          console.log('User is not a manager');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    if(currentUserData)
      fetchData();
  
    return () => {};
  }, [currentUserData]);
  
  const checkInvites = async () => {
    try {
  
      const thresholdTime = new Date(Date.now() - 60 * 60 * 1000);
      const inviteRef = collection(db, 'invites');

      const q = query(inviteRef, where("time", "<", thresholdTime));
      const querySnapshot = await getDocs(q);
  
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
  
      await batch.commit();
    } catch (error) {
      console.error('Error checking invites:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleChangePhoto = () => {
    setShowChangePhoto(true);
  }

  const hideChangePhoto = () => {
    setShowChangePhoto(false);
  }
  
  function seeMembers(){
    setOpenMembers(!openMembers);
  }
  
  function manageMem(){
    setManageMembers(!manageMembers);
  }

  function closeTeam() {
    setshowTeam(!showTeam);
  }
  
  function openTeam(team) {
    setshowTeam(!showTeam);
    setSelectedTeam(team);
  
    const members = [];
    members.push(...team.members);
    setMember(members);

    console.log("team you chose:", team);
    console.log("team members:", members);
  }

  const fetchUsers = async () => {
    const users = [];
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnapshot = await getDoc(userRef);

      if(userSnapshot.exists()) {
        const userCompany = currentUserData.company || '';

        const companyRef = collection(db, 'users');
        const companyQuery = query(companyRef, where('company', '==', userCompany));
        const companySnapshot = await getDocs(companyQuery);

        companySnapshot.forEach((doc) => {
          users.push(doc.data());
        });
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    }
    setUsers(users);
    console.log("my users:", users);
  };

  const fetchTeams = async () => {
    const teamsFetched = [];
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnapshot = await getDoc(userRef);
  
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const userCompany = userData.company;
  
        const teamRef = collection(db, "team");
        const queryCompany = query(teamRef, where('fromCompany', '==', userCompany));
        const companySnapshot = await getDocs(queryCompany);
  
        companySnapshot.forEach((companyDoc) => {
          const companyData = companyDoc.data();
          const members = companyData.members || [];
          const totalMembers = members.length;
          
          teamsFetched.push({ id: companyDoc.id, ...companyData, totalMembers });
        });
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    }
    setTeams(teamsFetched);
    console.log("my teams:", teamsFetched);
  };

  const handleUserChanges = (event) => {
    setSelectedUser(event.target.value);
  };
  
  const handleInviteUser = async () => {
    console.log('inviting...');

    const userCollection = collection(db, 'users');
    const userQuery = query(userCollection, where('email', '==', selectedUser));
    const userSnapshot = (await getDocs(userQuery));
    const userID = userSnapshot.docs[0].id;
    const currentTime = new Date();

    const invitesCollection = collection(db, 'invites');
    const inviteDocRef = await addDoc(invitesCollection, {
        manager: currentUserData.username || '',
        team: selectedTeam.id,
        time: currentTime,
        user: userID,
    });

    const url = `https://privo.pages.dev/invite?ref=${inviteDocRef.id}`;

    toast(
      <div className="text-lg flex flex-col items-center justify-center">
        <div className="p-5">
            <QRCode value={url} size={200} />
        </div>
        <p>Sent Invite Successfully!</p>
        <a href = {url}
        className="text-blue-500 hover:text-blue-700">
          {url}</a>
      </div>
    );
  }
  
  const handleRemoveUser = async () => {
    const selectedId = selectedTeam.id;

    if (!selectedUser) {
      showErrorModal('Please select a user before removing.');
      return;
    }
  
    try {
      const teamRef = doc(collection(db, 'team'), selectedId);
      const userRef = doc(collection(db, 'users'), (await getDocs(query(userRef, where('email', '==', selectedUser)))).docs[0]?.id);
  
      const { members = [] } = (await getDoc(teamRef)).data();
      if (!members.includes(selectedUser)) {
        showErrorModal(`${selectedUser} is not a member of the team.`);
        return;
      }
  
      await updateDoc(teamRef, { members: members.filter((member) => member !== selectedUser) });
      const userTeams = (await getDoc(userRef)).data()?.teams || [];
      await updateDoc(userRef, { teams: userTeams.filter((team) => team !== selectedId) });
  
      const notificationData = {
        time: new Date(),
        type: 'team',
        content: `Removed ${selectedUser} from team ${selectedId}`,
      };
  
      const { avatar = '', username = '', role = '' } = currentUserData;
      pushNotifications(selectedId, avatar, username, role, notificationData.time, notificationData.type, notificationData.content);
    } catch (error) {
      console.error('Error removing member:', error);
      showErrorModal('An error occurred while removing the user.');
    }
  
    window.location.reload();
  };  
  
  const showErrorModal = (text) => {
    setErrorModalMessage(text);
    setisErrorModalOpen(true);
  };

  const closeErrorModal = () => {
    setisErrorModalOpen(false);
  };

  return (
    <div className='flex dark:bg-gray-950 bg-white h-screen'>
      <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <ChangeTeamPhoto isOpen={showChangePhoto} hide={hideChangePhoto} team={selectedTeam}/>
      <Toaster/>

      <div className='flex flex-col flex-1 w-full'>
        <header className='justify-content z-10 mt-5 bg-white shadow-md dark:bg-gray-950'>
          <div className='flex md:justify-center flex-1 lg:mr-32'>
            <div>
              <button
                className='mr-10 ml-3 rounded-lg bg-blue-200 md:hidden block dark:bg-gray-900 dark:text-white text-black p-2'
                onClick={toggleSidebar} >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke-width='1.5'
                  stroke='currentColor'
                  class='w-6 h-6'
                >
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                  />
                </svg>
              </button>
            </div>
            <div className=' relative w-40 md:w-full max-w-xl mr-6 focus-within:text-purple-500'>
              <div className='absolute mb-6 inset-y-0 flex items-center pl-2'>
                <svg
                  className='w-4 h-4'
                  aria-hidden='true'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                    clipRule='evenodd'
                  ></path>
                </svg>
              </div>
              <input
                className='w-full pl-8 pr-2 text-large dark:text-black    text-black placeholder-blue-600 bg-gray-200 border-0 rounded-md dark:placeholder-gray-500 dark:focus:shadow-outline-blue dark:focus:placeholder-gray-600 dark:bg-gray-200focus:placeholder-gray-500 focus:bg-white focus:border-red-300 focus:outline-none focus:shadow-outline-purple focus:text-blue-500 form-input'
                type='text'
                placeholder='Search'
                aria-label='Search'
              ></input>
            </div>
            <DarkMode />
            <Profile />
          </div>
        </header>
        <main className='dark:bg-gray-900 dark:text-white text-black h-full'>
          {!currentUserData ?
          <><p className='text-5xl font-bold dark:text-white text-gray-700 opacity-100 m-10'>Loading...</p></> :
          currentUserData.role !== "manager" ?
          <><p className='text-5xl font-bold dark:text-white text-gray-700 opacity-100 m-10'>You are not a manager.</p></> :
          showTeam ? (
          <div className='bg-gray-100 dark:bg-gray-800 h-full px-4'>
            <h2 className='text-5xl font-bold dark:text-white text-gray-700 opacity-100 m-10'>
              <p className=" text-blue-500">Teams for Company:</p>
              <div className="w-3/5 border border-gray-300 mx-auto my-4"></div>
              <p className='font-normal'>{currentUserData?.company ?? 'loading...'}</p>
            </h2>
            <div className='cursor-pointer space-y-12 lg:grid lg:grid-cols-4 lg:gap-x-6 lg:space-y-0'>
              {teams?.map((team) => (
                <div
                  className='group relative bg-gray-200 p-2 border-2 border-solid border-gray-300'
                  onClick={() => openTeam(team)}
                >
                  <div className='relative h-70 w-full overflow-hidden rounded-lg dark:text-white bg-white sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 group-hover:opacity-75 sm:h-64'>
                    <div>
                      <img
                        src={team.imageUrl || teamLogo}
                        className='h-full w-full object-cover object-center p-5'
                        alt="Team Image"
                      />
                    </div>
                  </div>
                  <h3 className='p-3 text-sm dark:text-gray-400 text-gray-500'>
                    <p className='text-base font-semibold dark:text-white text-gray-900'>
                      {team.teamName}
                    </p>
                      <span className='absolute inset-0' />
                      Total Members: {team.totalMembers}
                  </h3>
                </div>
              ))}
            </div>
          </div>
          ) : (
          <div className='flex flex-row'>
            <div className='w-3/4 p-5 border-r-4 border-black-100'>
              <FileList company={currentUserData.company} team={selectedTeam?.id ?? ''} />
              {isErrorModalOpen && (
              <div id="modal" className="fixed top-0 left-0 w-full h-full bg-opacity-80 bg-gray-900 flex justify-center items-center">
                <div className="bg-white dark:text-white dark:bg-gray-500 rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-semibold mb-4">Error!</h2>
                  <p id="error-message">{ErrorModalMessage}</p>
                  <button onClick={closeErrorModal} className="mt-4 bg-purple-500 hover:bg-purple-400 text-white font-semibold px-4 py-2 rounded">Close</button>
                </div>
              </div>
              )}
            </div>
            <div className="min-h-screen w-1/4 overflow-y-auto max-h-screen">
              <ul className="divide-y dark:divide-gray-100 divide-gray-100 px-2 dark:bg-gray-800 bg-white-100 list-disc">
                <h2 className="text-3xl font-bold dark:text-white text-gray-700 py-8 sm:py-12 lg:py-8 border-b-2 border-gray-500">Settings</h2>
                <div className="h-1/4 flex flex-wrap-row justify-center items-center">
                  <button onClick={manageMem} className={`py-1 px-2 rounded m-2 ${manageMembers ? 'bg-white border border-blue-500 text-blue-500 ' : 'bg-sky-300 text-white '}`}>Manage Members</button>
                  <button  onClick={seeMembers} className={`py-1 px-2 rounded m-2 ${openMembers ? 'bg-white border border-blue-500 text-blue-500 ' : 'bg-sky-300 text-white'}`}>View Members</button>
                  <button  onClick={handleChangePhoto} className={'py-1 px-2 rounded m-2 bg-sky-300 text-white'}>Change Photo</button>
                </div>
                {manageMembers && (
                <>
                  <label for='users' className="p-4 m-4">Choose user:</label>
                  <div>
                    <select name='users' id='users' onChange={handleUserChanges} className="w-full">
                      <option value=''>Select a user</option>{" "}
                      {users.map((user) => (
                        <option key={user.email} value={user.email}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                    <button onClick={handleInviteUser} className="bg-sky-300 text-white py-1 px-1 rounded m-2">Invite User</button>
                    <button onClick={handleRemoveUser} className="bg-sky-300 text-white py-1 px-1 rounded m-2">Remove User</button>
                  </div>
                </>
                )}
                {member && member.length > 0? (
                <div className='h-full w-full grid  pl-2 pt-3 pb-3 border-b border-white-300'>
                  {openMembers && (
                    <div>
                      <h3 className="text-1xl font-bold dark:text-white text-gray-700 py-4 sm:py-12 lg:py-8 border-t-2 border-gray-500">Members</h3>
                      {member?.map((item, index) => (
                        <div className="my-5" key={index}>
                          <li className='flex justify-between gap-x-3 py-1 pe-6 hover:bg-gray-300'>{item}</li>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                ) : (<> <p>No members in this team.</p> </>)}
              </ul>
            </div>
          </div>)}
        </main>
      </div>
    </div>
  );
}