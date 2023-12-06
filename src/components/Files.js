import SideBar from './SideBar';
import FileUpload from './FileUpload';
import Profile from './Profile-Menu';
import DarkMode from './DarkMode';
import FileList from './FileList';
import {ReactComponent as Magnify} from '../images/magnify.svg';
import { useState, useEffect, useRef } from 'react';
import { firestore as db } from './firebase'; 
import { auth } from '../../src/components/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, where, query, doc, getDoc, updateDoc } from "firebase/firestore";
import myImage from '../images/logoOpacity.png';
import { ref, getDownloadURL, getMetadata, uploadString, deleteObject} from "firebase/storage";
import { Toaster, toast } from 'sonner'
import storage from './firebase';
import { pushNotifications } from './notifications';
import { deleteFromFirestore } from './fileData';



export default function Files(){
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [teamName, setTeamName] = useState('');
    const [showJoinedTeams, setShowJoinedTeams] = useState(true);
    const [joinedTeams, setJoinedTeams] = useState();
    const [currentUser, setCurrentUser] = useState();
    const [userCompany, setUserCompany] = useState();
    const [loadingTeams, setLoadingTeams] = useState(true);
    const [fileListKey, setFileListKey] = useState(0);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamCode, setTeamCode] = useState('');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteDoc, setInviteDoc] = useState();
    const [teamDoc, setTeamDoc] = useState();
    const [searchDropdown, setSearchDropdown] = useState(false);
    const [fileData, setFileData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteMenu, setDeleteMenu] = useState(false);
    const [selected, setSelected] = useState('');
    const [userAvatar, setUserAvatar] = useState(null);
    const [userName, setUserName] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const searchComponent = useRef(null);
    const dropdownComponent = useRef(null);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            fetchTeam(user);
            setCurrentUser(user);
            getUserCompany(user); 
          } else {
            setCurrentUser();
            setUserCompany(); // Reset userCompany when not authenticated
          }
        });
    
        return () => unsubscribe();
    }, [userCompany]);

    const handleSearchInput = (e) => {
        setSearchQuery(e.target.value);
    }


    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    }

    const toggleDropdown = () => {
        setSearchDropdown(!searchDropdown);
        fetchFiles();
    };

    const handleTeamClick = (selectedTeamName) => {
        setTeamName(selectedTeamName);
        setShowJoinedTeams(true);
        setFileListKey((prevKey) => prevKey + 1);
    };

    const clickJoinTeam = (teamName) => {
        setSelectedTeam((prevTeam) => (prevTeam === teamName ? null : teamName));
        setTeamName('');
    };

    const handleJoinTeam = async () => {
        const currentLoggedUser = auth.currentUser;
        if (!currentLoggedUser) {return;}
        
        try{
            const inviteRef = doc(db, 'invites', teamCode);
            const docSnap = await getDoc(inviteRef);

            if (docSnap.exists()) {
                console.log("Document data:", docSnap.data().user);
                if(docSnap.data().user === currentLoggedUser.uid){
                    setInviteDoc(docSnap.data());
                    setTeamDoc(docSnap.data().team);
                    openInviteModal();
                }
                else{
                    alert('Sorry, this code is not for you!');
                }
            } else {
                // docSnap.data() will be undefined in this case
                alert('Code is unavailable. Code may have expired.');
            }
        } catch (error) {
            console.error('Error fetching invite:', error);
        }
    };

    const handleAddToTeam = async () => {
        console.log("adding to team...");
    
        const currentLoggedEmail = auth.currentUser.email;
        const teamInvitation = inviteDoc.team;
    
        try {
            const teamCollection = collection(db, 'team');
            const teamDoc = doc(teamCollection, teamInvitation);
    
            const userCollection = collection(db, 'users');
            const userQuery = query(userCollection, where('email', '==', currentLoggedEmail));
            const userSnapshot = await getDocs(userQuery);
    
            const currentTeams = userSnapshot.docs[0].data().teams || [];
    
            if (!currentTeams.includes(teamInvitation)) {
                currentTeams.push(teamInvitation);
    
                const userDoc = doc(userCollection, userSnapshot.docs[0].id);
                await updateDoc(userDoc, { teams: currentTeams });
    
                toast.success(`You are now a member of ${teamInvitation}!`);
            } else {
                toast.warning(`You are already a member of ${teamInvitation}.`);
            }
    
            const docSnapshot = await getDoc(teamDoc);
            const currentMembers = docSnapshot.data().members || [];
    
            if (!currentMembers.includes(currentLoggedEmail)) {
                currentMembers.push(currentLoggedEmail);
    
                await updateDoc(teamDoc, {
                    members: currentMembers,
                });
            } else {
                console.log(`${currentLoggedEmail} is already a member of ${teamInvitation}.`);
            }
        } catch (error) {
            console.error('Error adding member:', error);
        }
    
        closeInviteModal();
    };    

    const openInviteModal = () => {
        setIsInviteModalOpen(true);
    };

    const closeInviteModal = () => {
        setIsInviteModalOpen(false);
    };

    const getUserCompany = async (user) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            const userUid = await getDoc(userRef);
        
            if (userUid.exists) {
                const userData = userUid.data();
                const userCompany = userData.company;
                const userAvatar = userData.avatar;
                const userName = userData.name;
                const userRole = userData.role;
        
                setUserName(userName);
                setUserAvatar(userAvatar);
                setUserRole(userRole);
                setUserCompany(userCompany);
            } else {
                console.log('User document not found');
                setUserCompany();
            }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setUserCompany();
            }
    };

    const fetchTeam = async (user) => {
        const teams = [];
        try {
        const userRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const userTeams = userData.teams || [];

            const teamRef = collection(db, 'team');
            const teamQuery = query(teamRef, where('teamName', 'array-contains-any', userTeams));
            const teamSnapshot = await getDocs(teamQuery);

            teamSnapshot.forEach((doc) => {
            const teamData = doc.data();
            const members = teamData.members || [];
            const totalMembers = members.length;

            teams.push({ id: doc.id, ...teamData, totalMembers });
            });
        }
        } catch (error) {
        console.error("Error fetching team:", error);
        }
        setJoinedTeams(teams);
        setLoadingTeams(false);
    };

    const fetchFiles = async () => {
        const teamFiles = [];
      
        try {
          for (const team of joinedTeams) {
            const fileRef = doc(db, 'files', team.id);
            const fileSnapshot = await getDoc(fileRef);
      
            if (fileSnapshot.exists()) {
              const data = fileSnapshot.data();
              if (data.fileData && Array.isArray(data.fileData)) {
                teamFiles.push(...data.fileData);
              }
            }
          }
        } catch (error) {
          console.error(error);
        }
      
        setFileData(teamFiles);
    };

    const member = (length) => {
        return length === 1 ? " member" : " members";
    };

    const renamePath = (path) => {
        const segments = path.split('/');
        if (segments.length >= 3) {
            return `${segments.slice(2).join(' > ')}`;
        } else {
            return path;
        }
    };

    const filteredData = fileData.filter((file) => 
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    function deleteFile(fileName) {
        const storageRef = ref(storage, selected.path);
        const notificationData = {
            time: new Date(),
            type: "file",
            content: "deleted " + fileName,
        };

        return deleteObject(storageRef)
            .then(() => {
            pushNotifications(
                selected.team,
                userAvatar,
                userName,
                userRole,
                notificationData.time,
                notificationData.type,
                notificationData.content
            );
            deleteFromFirestore(fileName, selected.path, selected.team);
            setDeleteMenu(false);
            fetchFiles();
            toast.success(`File ${fileName} deleted successfully.`);
            })
            .catch((error) => {
            console.error(`Error deleting file ${fileName}: ${error.message}`);
        });
  
    }

    function closeDelete(){
        setDeleteMenu(false);
    }

    function downloadFile(fileName) {
        return new Promise((resolve, reject) => {
            const storageRef = ref(storage, selected.path);
    
            getDownloadURL(storageRef)
                .then((url) => {
                    const xhr = new XMLHttpRequest();
                    xhr.responseType = 'blob';
    
                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            const blob = xhr.response;
                            const objectURL = URL.createObjectURL(blob);
    
                            const a = document.createElement('a');
                            a.href = objectURL;
                            a.download = fileName;
    
                            document.body.appendChild(a);
                            a.click();
    
                            document.body.removeChild(a);
    
                            URL.revokeObjectURL(objectURL);
                            resolve(`File ${fileName} downloaded successfully`);
                        } else {
                            reject(new Error(`Failed to download ${fileName}`));
                        }
                    };
    
                    xhr.onerror = () => {
                        reject(new Error(`Network error while downloading ${fileName}`));
                    };
    
                    xhr.open('GET', url);
                    xhr.send();
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
    
    const handleDownload = (fileName) => {
        toast.promise(downloadFile(fileName), {
            loading: 'Downloading...',
            success: (message) => message,
            error: (error) => `Error downloading file: ${error.message}`,
        });
    };

    useEffect(() => {
        const click = (event) => {
            if(searchComponent.current && !searchComponent.current.contains(event.target)){
                if(dropdownComponent.current && dropdownComponent.current.contains(event.target)){
                    setSearchDropdown(false);
                }
            }
        };

        document.addEventListener('click', click);
        
        return () => {
            document.addEventListener('click', click);
        }
    }, [searchDropdown]);
    
  
    return(
        <div className="flex bg-no-repeat bg-right-bottom dark:bg-gray-950 h-screen overflow-hidden': isSideMenuOpen }" style={{ backgroundImage: `url(${myImage})` }}>   
           
           <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
           <Toaster richColors expand={false} position="bottom-center"/>

            <div className='class="flex flex-col flex-1 w-full"'>
            <header className='justify-content z-10 mt-5 bg-white shadow-md dark:bg-gray-950'>
                
                <div className="flex md:justify-center flex-1 lg:mr-32">
                    <div>
                        <button className="mr-10 ml-3 rounded-lg bg-blue-200 md:hidden block dark:bg-gray-900 dark:text-white text-black p-2" onClick={toggleSidebar}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>
                    <div className="items-center relative w-40 md:w-full max-w-xl mr-6 focus-within:text-purple-500">
                        <div className='flex items-center'>
                            <div className="absolute flex items-center pl-2">
                                <Magnify/>
                            </div>
                            <input
                                ref={searchComponent}
                                className="w-full pl-8 pr-2 text-lg dark:text-black text-black placeholder-black bg-gray-200 border-0 rounded-md dark:placeholder-gray-500 dark:focus:shadow-outline-blue dark:focus:placeholder-gray-600 dark:bg-gray-200 focus:placeholder-gray-500 focus:bg-white focus:border-red-300 focus:outline-none focus:shadow-outline-purple focus:text-blue-500 form-input"
                                type="text"
                                placeholder="Search files (by file name)"
                                aria-label="Search Files"
                                onClick={toggleDropdown}
                                onChange={handleSearchInput}
                            />             
                        </div>           
                        <ul
                            ref={dropdownComponent}
                            onClick={() => setSearchDropdown(true)}
                            className={`z-50 absolute mt-2 w-full bg-white border rounded-md border-gray-300 shadow-lg ${searchDropdown ? '' : 'hidden'}`}
                        >
                            {filteredData.slice(0, 10).map((file) => (
                                <div key={file} className='flex flex-col group'>
                                    <ul className='px-4 py-2 hover:bg-gray-100 cursor-pointer'>
                                        <li>{file.fileName} | {file.team}</li>
                                        <small>{renamePath(file.path)}</small>
                                    </ul>
                                    <div className='max-h-0 overflow-hidden transition-max-height group-hover:max-h-full flex flex-col bg-white border rounded-md border-gray-300 shadow-lg mt-2'>
                                        <button className='hover:bg-gray-100' onClick={() => {setDeleteMenu(true); setSelected(file); toggleDropdown();}}>Delete</button>
                                        <button className='hover:bg-gray-100' onClick={() => {handleDownload(file.fileName); toggleDropdown(); setSelected(file);}}>Download</button>
                                    </div>
                                </div>
                            ))}
                        </ul>
                    </div> 
                    <div className='mt-1'>
                        <DarkMode/>
                    </div> 
                    <Profile/>
                </div> 
            </header>
                <main>
                    <div>
                        {loadingTeams ? (
                        <div className='overflow-x-auto p-5'>
                            <div className='flex space-x-4'>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className='flex-none animate-pulse'>
                                <div className='bg-slate-50 p-4 rounded-lg shadow-md'>
                                    <div className='h-8 w-12 bg-gray-300 rounded mb-2'></div>
                                    <div className='h-4 w-12 bg-gray-300 rounded'></div>
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
                        ) : (
                        <div className='overflow-x-auto'>
                            <div className='flex space-x-4'>
                            {joinedTeams && joinedTeams.length > 0 && showJoinedTeams &&  (
                                <div className='overflow-x-auto p-5'>
                                    <div className='flex space-x-4'>
                                    {joinedTeams.map((team) => (
                                        <div className='flex'>
                                            <div key={team.id} className='flex-none'>
                                                <div className={`p-4 rounded-lg cursor-pointer ${teamName === team.teamName ? 'bg-slate-200' : 'bg-slate-50 shadow-md '}`} onClick={() => handleTeamClick(team.teamName)}>
                                                    <h2 className='text-xl font-semibold dark:text-white text-gray-700'>{team.teamName}</h2>
                                                    <p className='text-gray-500'>{team.totalMembers} {member(team.totalMembers)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className='flex'>
                                        <div className='flex-none'>
                                            <div className={`p-4 rounded-lg cursor-pointer ${teamName === '' ? 'bg-slate-200' : 'bg-slate-50 shadow-md'}`} onClick={() => clickJoinTeam(null)}>
                                                <h2 className='text-xl font-semibold dark:text-white text-gray-700'>Join a team</h2>
                                                <p className='text-gray-500'>(Use the code given by your manager)</p>
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>
                        )}
                    </div>

                    {deleteMenu && selected && (
                    <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 drop-shadow-lg bg-black bg-opacity-50'>
                        <div className='bg-white dark:bg-gray-900 rounded-lg p-4 shadow-md'>
                            <h2 className='text-lg font-semibold mb-4'>Are you sure you want to delete {selected.fileName}?</h2>
                            <button className='bg-red-500 text-white py-2 px-4 rounded mr-2 hover:bg-blue-600' onClick={() => deleteFile(selected.fileName)}>Yes</button>
                            <button className='bg-gray-300 text-gray-700 py-2 px-4 rounded hover-bg-gray-400' onClick={() => closeDelete()}>Cancel</button>
                        </div>
                    </div>
                    )}

                    {teamName !== '' ? (
                        <div key={fileListKey}>
                            <FileList company={userCompany} team={teamName} />
                        </div>
                    ) : (
                        <div className="my-4 p-2 border rounded-lg bg-white mx-auto inline-block">
                            <div className='bg-slate-50 p-2 rounded-lg'>
                                <div className="text-xl">CLICK AVAILABLE TEAMS</div>
                                <div className="flex items-center">
                                    <div className="flex-1 border-t border-gray-300"></div>
                                    <div className="mx-4 text-gray-500">OR</div>
                                    <div className="flex-1 border-t border-gray-300"></div>
                                </div>
                                <div className="text-xl">JOIN A TEAM</div>
                                <div className='flex m-2'>
                                    <input
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                                        type="text"
                                        placeholder="Enter Team Code"
                                        onChange={(e) => setTeamCode(e.target.value)}
                                    />
                                    <button onClick={handleJoinTeam} className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md">
                                        JOIN
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {isInviteModalOpen && (
                        <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                            </div>

                            {/* This is your modal */}
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                            &#8203;
                            </span>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            {/* Modal content */}
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                {/* Your content goes here */}
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">You have been invited to team {inviteDoc.team}!</h3>
                                    <div className="mt-2">
                                    <p className="text-sm text-gray-500">{inviteDoc.manager} has invited you to join {inviteDoc.team}.</p>
                                    <p className="text-sm text-gray-500">{inviteDoc.time ? inviteDoc.time.toDate().toLocaleString() : ''}</p>
                                    </div>
                                </div>
                                </div>
                            </div>
                            {/* Modal buttons */}
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                onClick={closeInviteModal}
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                Cancel
                                </button>
                                <button
                                onClick={handleAddToTeam}
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                Accept
                                </button>
                            </div>
                            </div>
                        </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
       
    )
}