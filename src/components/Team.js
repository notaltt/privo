import SideBar from "./SideBar";
import Profile from "./Profile-Menu";
import DarkMode from "./DarkMode";
import React, { useEffect, useState } from "react";
import { firestore as db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, where, query, doc, updateDoc, getDoc, addDoc } from "firebase/firestore";
import { auth } from '../../src/components/firebase';
import { pushNotifications } from './notifications';
import FileList from './FileList';
import Files from './Files';

export default function Team() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showTeam, setshowTeam] = useState(true);
  const [team, setTeam] = useState();
  const [selectedId, setSelectedId] = useState();
  const [member, setMember] = useState();
  const [users, setUsers] = useState();
  const [selectedUser, setSelectedUser] = useState("");
  const [isErrorModalOpen, setisErrorModalOpen] = useState(false);
  const [ErrorModalMessage, setErrorModalMessage] = useState("");
  const [hasFetched, setHasFetched] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [openMembers, setOpenMembers] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (!hasFetched) {
          getUser(user)
          fetchTeam(user);
          fetchUsers(user);
          checkUserRole(user); // Add this line to check the user's role
          setHasFetched(true);
        }
      } else {
        console.log("User is not authenticated.");
      }
    });
  
    // Unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, [hasFetched]);

  const getUser = async (user) => {
    try{
      const userData = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userData);

      if(userDoc.exists()){
        const userData = userDoc.data();
        const userAvatar = userData.avatar;
        const userName = userData.name;
        const userRole = userData.role;

        setUserName(userName);
        setUserAvatar(userAvatar);
        setUserRole(userRole);
      }
    }catch(e){

    }
  };
  

  const checkUserRole = async (user) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
  
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        const userRole = userData.role; // Replace 'role' with the actual field name where the role is stored
  
        if (userRole === "manager") {
          setIsManager(true);
          console.log(userRole);
          console.log("User is a manager");
        }
        else if(userRole === "member"){
          setIsManager(false);
          console.log(userRole);
          console.log("User is a member");
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };
  


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  
  
  function seeMembers(){
    setOpenMembers(!openMembers);
  }


  function closeTeam() {
    setshowTeam(!showTeam);
  }
  function openTeam(id) {
    setshowTeam(!showTeam);
  
    const members = [];
    // Fetch the team and its members
    if (team) {
      team.forEach((element) => {
        setSelectedId(id);
        if (element.id === id) {
          element.members.map((member) => {
            members.push(member);
          });
        }
      });
      setMember(members);
    }
    console.log(id);
  }
  

  // every user can see all teams
  const fetchTeam = async (user) => {
    const teams = [];
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);
  
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const userCompany = userData.company;
        //const userTeams = userData.teams || [];
  
        const teamRef = collection(db, "team");
        const queryCompany = query(teamRef, where('fromCompany', '==', userCompany));
        const companySnapshot = await getDocs(queryCompany);
  
        companySnapshot.forEach((companyDoc) => {
          const companyData = companyDoc.data();
          const members = companyData.members || [];
          const totalMembers = members.length;
          
          teams.push({ id: companyDoc.id, ...companyData, totalMembers });
        });
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    }
    setTeam(teams);
    console.log("AVAILABLE", teams, "UNTIL HERE");
  };
  

     

  const fetchUsers = async (user) => {
    const users = [];
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);

      if(userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const userCompany = userData.company;

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
    console.log(users);
  };

  

  const handleUserChange = (event) => {
    setSelectedUser(event.target.value);
  };

  const handleAddUser = async () => {
    if (!selectedUser) {
      setErrorModalMessage('Please select a user before adding.');
      openErrorModal();
      return; // Exit the function to prevent further execution
    }
  
    try {
      // Reference to the team document
      const teamCollection = collection(db, 'team');
      const teamDoc = doc(teamCollection, selectedId);
      const newMember = selectedUser;
  
      // Reference to the user collection
      const userCollection = collection(db, 'users');
      
      // Query for the selected user by their name (you can change this based on your database structure)
      const userQuery = query(userCollection, where('email', '==', selectedUser));
      const userSnapshot = await getDocs(userQuery);
  
      // Get the current teams of the selected user
      const currentTeams = userSnapshot.docs[0].data().teams || [];
  
      // Check if the selectedUser is already a member
      if (currentTeams.includes(selectedId)) {
        setErrorModalMessage(`${selectedUser} is already a member of the team.`);
        openErrorModal();
        return; // Exit the function to prevent further execution
      }
  
      // Retrieve the current team document
      const docSnapshot = await getDoc(teamDoc);
      const currentMembers = docSnapshot.data().members || [];
  
      // Add the selectedUser to the current members
      currentMembers.push(newMember);
  
      // Update the members in the team document
      await updateDoc(teamDoc, {
        members: currentMembers,
      });
  
      // Update the user's "teams" array
      currentTeams.push(selectedId);
      const userDoc = doc(userCollection, userSnapshot.docs[0].id);
      await updateDoc(userDoc, { teams: currentTeams });
  
      // Send a notification
      const notificationData = {
        time: new Date(),
        type: "team",
        content: `Added ${newMember} to team ${selectedId}`,
      };
  
      pushNotifications(selectedId, userAvatar, userName, userRole, notificationData.time, notificationData.type, notificationData.content);
  
    } catch (error) {
      console.error('Error adding member:', error);
      setErrorModalMessage('An error occurred while adding the user.');
      openErrorModal();
    }
    window.location.reload();
  };
  
  const handleInviteUser = async () => {
    const user = auth.currentUser;
    const currentuserid = user.uid;

    const teamCollection = collection(db, 'team');
    const teamDoc = doc(teamCollection, selectedId).id;

    const userCollection = collection(db, 'users');
    const userQuery = query(userCollection, where('email', '==', selectedUser));
    const userSnapshot = (await getDocs(userQuery));
    const userID = userSnapshot.docs[0].id;

    // Get the current time
    const currentTime = new Date();

    // Reference to the 'invites' collection
    const invitesCollection = collection(db, 'invites');

    // Create a new document in the 'invites' collection
    const inviteDocRef = await addDoc(invitesCollection, {
        manager: userName,
        team: teamDoc,
        time: currentTime,
        user: userID,
    });

    alert(`
    Sent Invite Successfully!
    manager: ${userName}
    team: ${teamDoc}
    time: ${currentTime}
    user: ${userID}

    link: https://privo.pages.dev/invite?ref=${inviteDocRef.id}
    `);
  }
  
  const handleRemoveUser = async () => {
    if (!selectedUser) {
      setErrorModalMessage('Please select a user before removing.');
      openErrorModal();
      return;
    }
  
    try {
      
      const teamCollection = collection(db, 'team');
      const teamDoc = doc(teamCollection, selectedId);
      const userToRemove = selectedUser;
  
      
      const userCollection = collection(db, 'users');
  
      
      const userQuery = query(userCollection, where('email', '==', selectedUser));
      const userSnapshot = await getDocs(userQuery);
  
      // Get the current teams of the selected user
      const userDocId = userSnapshot.docs[0].id;
      const currentTeams = userSnapshot.docs[0].data().teams || [];
  
      
      if (!currentTeams.includes(selectedId)) {
        setErrorModalMessage(`${selectedUser} is not a member of the team.`);
        openErrorModal();
        return;
      }
  
      // Retrieve the current team document
      const docSnapshot = await getDoc(teamDoc);
      const currentMembers = docSnapshot.data().members || [];
  
      // Remove the selectedUser 
      const updatedMembers = currentMembers.filter((member) => member !== userToRemove);
  
      // Update members in team doc
      await updateDoc(teamDoc, {
        members: updatedMembers,
      });
  
      // Update the user's "teams" 
      const updatedUserTeams = currentTeams.filter((team) => team !== selectedId);
      await updateDoc(doc(userCollection, userDocId), { teams: updatedUserTeams });
  
      
      const notificationData = {
        time: new Date(),
        type: "team",
        content: `Removed ${userToRemove} from team ${selectedId}`,
      };
  
      pushNotifications(selectedId, userAvatar, userName, userRole, notificationData.time, notificationData.type, notificationData.content);
    } catch (error) {
      console.error('Error removing member:', error);
      setErrorModalMessage('An error occurred while removing the user.');
      openErrorModal();
    }
    window.location.reload();
  };
  
  
  
  
  
  

  const openErrorModal = () => {
    setisErrorModalOpen(true);
  };

  const closeErrorModal = () => {
    setisErrorModalOpen(false);
  };

  return (
    <div className='flex dark:bg-gray-950 bg-white h-screen'>
      <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className='flex flex-col flex-1 w-full"'>
        <header className='justify-content z-10 mt-5 bg-white shadow-md dark:bg-gray-950'>
          <div className='flex md:justify-center flex-1 lg:mr-32'>
            <div>
              <button
                className='mr-10 ml-3 rounded-lg bg-blue-200 md:hidden block dark:bg-gray-900 dark:text-white text-black p-2'
                onClick={toggleSidebar}
              >
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
            <div className='mt-1'>
              <DarkMode />
            </div>

            <Profile />
          </div>
        </header>
        <main className='dark:bg-gray-900 dark:text-white text-black'>
          {showTeam ? (
            <div>
              <div className='bg-gray-100 dark:bg-gray-800'>
                <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-12'>
                  <div className='mx-auto max-w-2xl py-8 sm:py-12 lg:max-w-none lg:py-8'>
                    <h2 className='text-3xl font-bold dark:text-white text-gray-700 opacity-100'>
                      Teams You're In
                    </h2>
                    <div className='cursor-pointer mt-6 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:space-y-0'>
                      {team?.map((team) => (
                        <div
                          className='group relative'
                          onClick={() => openTeam(team.id)}
                        >
                          <div className='relative h-70 w-full overflow-hidden rounded-lg dark:text-white bg-white sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 group-hover:opacity-75 sm:h-64'>
                            <div>
                              <img
                                src={team.imageUrl}
                                
                                className='h-full w-full object-cover object-center'
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
                </div>
              </div>
            </div>
          ) : (
            <div className='flex flex-row'>
              <div className='w-3/4 p-5 border-r-4 border-black-100'>
            <>
              
              <FileList/> 
              {/* Test purposes */}
              
              

              {isErrorModalOpen && (
                <div id="modal" className="fixed top-0 left-0 w-full h-full bg-opacity-80 bg-gray-900 flex justify-center items-center">
                  <div className="bg-white dark:text-white dark:bg-gray-500 rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-semibold mb-4">Error!</h2>
                    <p id="error-message">{ErrorModalMessage}</p>
                    <button onClick={closeErrorModal} className="mt-4 bg-purple-500 hover:bg-purple-400 text-white font-semibold px-4 py-2 rounded">Close</button>
                  </div>
                </div>
              )}
              

              

              
            </>
            </div>
            <div className="min-h-screen w-1/4 overflow-y-auto max-h-screen">
              <ul className="divide-y dark:divide-gray-100 divide-gray-100 px-2 dark:bg-gray-800 bg-white-100 list-disc">
                <h2 className="text-3xl font-bold dark:text-white text-gray-700 py-8 sm:py-12 lg:py-8 border-b-2 border-gray-500">Settings</h2>
                {isManager && (
                <>           
                <label for='users' className="p-4 m-4">Choose user:</label>

                <div>
                  <select name='users' id='users' onChange={handleUserChange} classNam="w-screen">
                    <option value=''>Select a user</option>{" "}
                    {users.map((user) => (
                      <option key={user.email} value={user.email}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  
                </div>
                </>
              )}
              <div className="h-1/4 flex flex-wrap-row">
                <button onClick={handleInviteUser} className="bg-sky-300 text-white py-1 px-1 rounded m-2">Invite User</button>
                <button onClick={handleAddUser} className="bg-sky-300 text-white py-1 px-1 rounded m-2">Add User</button>
                <button onClick={handleRemoveUser} className="bg-sky-300 text-white py-1 px-1 rounded m-2">Remove User</button>
                <button
                  onClick={seeMembers}
                  className={`py-1 px-2 rounded m-2 ${openMembers ? 'bg-white border border-blue-500 text-blue-500' : 'bg-sky-300 text-white'}`}
                >
                  Members
                </button>
              </div>
              {member && member.length > 0? (
                <>
                <div>
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
                
              </div>
                </>

              )
              :
              (<>
                <p>No members in this team.</p>
              </>
              )}
              </ul>
            </div>
                
          </div>
          

            
          )}
        </main>
      </div>
    </div>
  );
}