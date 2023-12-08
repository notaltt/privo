import SideBar from './SideBar';
import Profile from './Profile-Menu';
import DarkMode from './DarkMode';
import React, { useState, useEffect, useRef } from 'react';
import AuthDetails from './AuthDetails';
import { firestore as db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, where, query, doc, updateDoc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { auth } from '../../src/components/firebase';
import { pushNotifications } from './notifications';
import {ReactComponent as Magnify} from '../images/magnify.svg';
import { Toaster, toast } from 'sonner'
import { ref, getDownloadURL, getMetadata, uploadString, deleteObject} from "firebase/storage";
import storage from './firebase';
import { deleteFromFirestore } from './fileData';

export default function Dashboard({user}){
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isErrorModalOpen, setisErrorModalOpen] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userAvatar, setUserAvatar] = useState(null);
    const [userName, setUserName] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userNotification, setUserNotification] = useState([]);
    const [timePassed, setTimePassed] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userManager, setUserManger] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [tasks, setTasks] = useState([]);
    const searchComponent = useRef(null);
    const dropdownComponent = useRef(null);
    const [searchDropdown, setSearchDropdown] = useState(false);
    const [fileData, setFileData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selected, setSelected] = useState('');
    const [joinedTeams, setJoinedTeams] = useState();
    const [deleteMenu, setDeleteMenu] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [announceData, setAnnounceData] = useState([]);
    const [deleteAnnounce, setDeleteAnnounce] = useState(false);
    const [selectedAnnounce, setSelectedAnnounce] = useState('');

    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                if (!hasFetched) {
                    getUser(user);
                    fetchNotifications(user);
                    fetchAnnouncement(user);
                    fetchTeam(user);
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
        try {
            const userData = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userData);
    
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userAvatar = userData.avatar;
                const userName = userData.name;
                const userRole = userData.role;
                const userEmail = userData.email;
                console.log("User Email in getUser:", userEmail);
                setUserName(userName);
                setUserAvatar(userAvatar);
                setUserRole(userRole);
    
                if (userRole === 'manager') {
                    setUserManger(true);
                } else {
                    setUserManger(false);
                }
    
                if (userEmail) {
                    fetchTasks(userEmail);
                }
            }
        } catch (e) {
            console.log(e);
        }
    };
    
    const fetchTasks = async (email) => { // Receive email parameter
        console.log("User Email in fetchTasks:", email);
        try {
            const q = query(
                collection(db, 'tasks'),
                where('assignedUser', '==', email) // Use the passed email
            );
            const snapshot = await getDocs(q);
    
            const fetchedTasks = snapshot.docs.map((doc) => ({
                id: doc.id,
                taskName: doc.data().taskName,
                assignedUser: doc.data().assignedUser,
                date: doc.data().date,
                description: doc.data().description,
                team: doc.data().team,
            }));
    
            setTasks(fetchedTasks);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    const calculateTimePassed = (timestamp) => {
        const currentTime = new Date();
        const notificationTime = new Date(timestamp);
        const timeDifference = currentTime - notificationTime;

        if (timeDifference < 1000) {
            return "just now";
        } else if (timeDifference < 60000) {
            return Math.floor(timeDifference / 1000) + " seconds ago";
        } else if (timeDifference < 3600000) {
            return Math.floor(timeDifference / 60000) + " minutes ago";
        } else if (timeDifference < 86400000) {
            const hoursAgo = Math.floor(timeDifference / 3600000);
            return hoursAgo + (hoursAgo === 1 ? " hour ago" : " hours ago");
        } else {
            const daysAgo = Math.floor(timeDifference / 86400000);
            return daysAgo + (daysAgo === 1 ? " day ago" : " days ago");
        }        
    };      

    const fetchNotifications = async (user) => {
        const notification = [];
        try{
        const userData = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userData);

        if(userDoc.exists()){
            const userData = userDoc.data();
            const userTeams = userData.teams || [];

            for (const team of userTeams) {
                const notificationRef = doc(db, 'notifications', team);
                const notificationSnapshot = await getDoc(notificationRef);
            
                if (notificationSnapshot.exists()) {
                const data = notificationSnapshot.data();
                    if (data.notificationData && Array.isArray(data.notificationData)) {
                        notification.push(...data.notificationData);
                    }
                }
            }

            notification.sort((a, b) => new Date(b.time) - new Date(a.time));
        }
        } catch(e){
            console.log(e)
        }
        setUserNotification(notification);
        setLoading(false);
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
        console.log(joinedTeams);
    };

    // const openErrorModal = () => {
    //     setisErrorModalOpen(true);
    // };

    // const closeErrorModal = () => {

    //     setisErrorModalOpen(false);
    // };

    const addAnnouncement = async () => {
        const announceRef = doc(db, 'announcement', selectedTeam.trim());
        const announceData = {
            name: userName,
            team: selectedTeam.trim(),
            message: newAnnouncement,
            date: new Date().toString()
        };

        const snapshot = await getDoc(announceRef);

        try{
           if(snapshot.exists()){
            await updateDoc(announceRef, {
                announcement: arrayUnion(announceData)
            });
           }else{
            await setDoc(announceRef, {
                announcement: arrayUnion(announceData)
            });
           }
        }catch(e){
            console.log(e);
        }

        fetchAnnouncement(currentUser);
    };

    const fetchAnnouncement = async (user) => {
        let announcementData = [];
        try{
            const userRef = doc(db, 'users', user.uid);
            const userSnapshot = await getDoc(userRef);

            if(userSnapshot.exists()){
                const userData = userSnapshot.data();
                const userTeams = userData.teams || [];

                for(const team of userTeams){
                    const announceRef = doc(db, 'announcement', team);
                    const announceSnapShot = await getDoc(announceRef);

                    if(announceSnapShot.exists()){
                        const data = announceSnapShot.data();
                        if(data.announcement && Array.isArray(data.announcement)){
                            announcementData.push(...data.announcement);
                        }
                    }
                }
            }
            announcementData.sort((a, b) => new Date(b.date) - new Date(a.date));
        }catch(e){
            console.log(e);
        }
        setAnnounceData(announcementData);
    }

    const deleteAnnouncement = async (data) => {
        const annRef = doc(db, 'announcement', data.team);
        const annData = {
            date: data.date,
            message: data.message,
            name: data.name,
            team: data.team
        };

        try{
            await updateDoc(annRef, {
                announcement: arrayRemove(annData)
            })
            setDeleteAnnounce(false);
            toast.success('Annoucement deleted...');
            fetchAnnouncement(currentUser);
        }catch(e){
            console.log(e);
        }
    }

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

    const toggleDropdown = () => {
        setSearchDropdown(!searchDropdown);
        fetchFiles();
    };

    const handleSearchInput = (e) => {
        setSearchQuery(e.target.value);
    }

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
        setDeleteAnnounce(false);
    }

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

    function openDelete(data){
        if(userManager){
            setDeleteAnnounce(true);        
        }
    }
    
    return(
        <div className="flex dark:bg-gray-950 bg-white">  
                      
            <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar}/>
            <Toaster richColors expand={false} position="bottom-center"/>
            
            <div className='flex flex-col flex-1 w-1/2'>
           
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
                    <div className='flex flex-row'>
                        <div className='w-3/4 h-screen grid grid-rows-2 p-5'>
                            <div className='p-5 h-3/4 rounded-xl' id='announcement'>
                                <h1 className='text-left text-3xl font-bold dark:text-white text-gray-700'>Announcements</h1>
                                {userManager && (
                                    <div className="mb-4 flex gap-3">
                                    <input
                                        type="text"
                                        value={newAnnouncement}
                                        onChange={(e) => setNewAnnouncement(e.target.value)}
                                        placeholder="Add a new announcement"
                                        className="w-full p-2 border border-gray-200 rounded"
                                    />
                                    <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                                        <option value="" disabled hidden>
                                            Select a Team
                                        </option>
                                        {joinedTeams && joinedTeams.map((team) => (
                                            <option key={team.id} value={team.teamName}>
                                                {team.teamName}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={addAnnouncement}
                                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Add Announcement
                                    </button>
                                    </div>
                                )}
                                {announceData.length > 0 ? (
                                    <div className="announceScroll h-full overflow-y-auto">
                                        {announceData.map((data, index) => (
                                            <div key={index} className={`flex p-4 border border-gray-200 rounded mb-4 ${userManager ? 'hover:bg-slate-100 cursor-pointer' : ''}`} onClick={() => {openDelete(); setSelectedAnnounce(data)}}>
                                                <div className="flex-1" >
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <span className="font-semibold">{data.name}</span>
                                                        <p className="ml-2">{data.message} | {data.team}</p>
                                                        <div className="text-gray-500 text-sm">
                                                            {calculateTimePassed(data.date)} 
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ):(
                                    <div>No announcements</div>
                                )}
                            </div>
                            <div className='p-5 max-h-1/2 bg-slate-50 rounded-xl' id='tasks'>
                                <div>
                                    {tasks.length > 0 ? (
                                    <ul className="divide-y divide-gray-300">
                                        {tasks.map((task) => (
                                        <li key={task.id} className="py-4">
                                            <div className="bg-white rounded-lg shadow-md p-4">
                                            <h1 className="text-xl font-semibold">{task.taskName}</h1>
                                            <p className="text-gray-600">{task.date}</p>
                                            <p className="text-gray-600">{task.team}</p>
                                            </div>
                                        </li>
                                        ))}
                                    </ul>
                                    ) : (
                                    <p className="text-gray-600">No tasks assigned to you.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {deleteAnnounce && selectedAnnounce && (
                            <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 drop-shadow-lg bg-black bg-opacity-50'>
                            <div className='bg-white dark:bg-gray-900 rounded-lg p-4 shadow-md'>
                                <h2 className='text-lg font-semibold mb-4'>Are you sure you want to delete this announcement?</h2>
                                <button className='bg-red-500 text-white py-2 px-4 rounded mr-2 hover:bg-blue-600' onClick={() => deleteAnnouncement(selectedAnnounce)}>Yes</button>
                                <button className='bg-gray-300 text-gray-700 py-2 px-4 rounded hover-bg-gray-400' onClick={() => closeDelete()}>Cancel</button>
                            </div>
                        </div>
                        )}

                        {deleteMenu && selected && (
                        <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 drop-shadow-lg bg-black bg-opacity-50'>
                            <div className='bg-white dark:bg-gray-900 rounded-lg p-4 shadow-md'>
                                <h2 className='text-lg font-semibold mb-4'>Are you sure you want to delete {selected.fileName}?</h2>
                                <button className='bg-red-500 text-white py-2 px-4 rounded mr-2 hover:bg-blue-600' onClick={() => deleteFile(selected.fileName)}>Yes</button>
                                <button className='bg-gray-300 text-gray-700 py-2 px-4 rounded hover-bg-gray-400' onClick={() => closeDelete()}>Cancel</button>
                            </div>
                        </div>
                        )}

                        {loading ? (
                            <div className='h-screen w-1/4 overflow-y-auto bg-gray-100'>
                                <ul className="divide-y dark:divide-gray-100 divide-gray-100 px-6 dark:bg-gray-800 bg-gray-100">
                                    <h2 className="text-3xl font-bold dark:text-white text-gray-700 py-8 sm:py-12 lg:py-8">Loading notifications...</h2>
                                </ul>
                            </div>
                        ) : (
                            userNotification.length > 0 ? (
                                <div className='h-screen w-1/4 overflow-y-auto'>
                                    <ul className="divide-y dark:divide-gray-100 divide-gray-100 px-6 dark:bg-gray-800 bg-gray-100">
                                        <h2 className="text-3xl font-bold dark:text-white text-gray-700 py-8 sm:py-12 lg:py-8 border-b-2 border-gray-500">Notifications</h2>
                                        {userNotification.map((person) => (
                                            <li key={person.id} className="flex justify-between gap-x-6 py-5 pe-6">
                                                <div className="flex min-w-0 bggap-x-4">
                                                    <img className="h-12 w-12 flex-none rounded-full bg-gray-50 me-4" src={person.avatar} alt="" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-start dark:text-white font-semibold leading-6 text-gray-900">{person.name}</p>
                                                        <p className="mt-1 truncate text-xs leading-5 dark:text-white text-gray-500">{person.content} | {person.team}</p>
                                                    </div>
                                                </div>
                                                <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                                                    <p className="text-sm leading-6 dark:text-white text-gray-900">{person.role}</p>
                                                    <p className="text-xs leading-5 text-gray-500">{calculateTimePassed(person.time)}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className='h-screen w-1/4 overflow-y-auto bg-gray-100'>
                                    <ul className="divide-y dark:divide-gray-100 divide-gray-100 px-6 dark:bg-gray-800 bg-gray-100">
                                        <h2 className="text-3xl font-bold dark:text-white text-gray-700 py-8 sm:py-12 lg:py-8">No notifications available.</h2>
                                    </ul>
                                </div>
                            )
                            
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}