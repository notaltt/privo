import SideBar from './SideBar';
import Profile from './Profile-Menu';
import DarkMode from './DarkMode';
import React, { useState, useEffect } from 'react';
import AuthDetails from './AuthDetails';
import { firestore as db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, where, query, doc, updateDoc, getDoc } from "firebase/firestore";
import { auth } from '../../src/components/firebase';
import { pushNotifications } from './notifications';


export default function Dashboard(){
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isErrorModalOpen, setisErrorModalOpen] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userAvatar, setUserAvatar] = useState(null);
    const [userName, setUserName] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userNotification, setUserNotification] = useState([]);
    const [timePassed, setTimePassed] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userManager, setUserManger] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState('');


    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    }

    const announceData = [
        {
            name: 'Jerryvel Cabanero',
            date: 'Thu Nov 02 2023 14:20:01 GMT+0800 (Philippine Standard Time)',
            content: 'Files should be posted by today.',
            team: 'Computer Engineering'
        }
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setCurrentUser(user);
            if (!hasFetched) {
              getUser(user)
              fetchNotifications(user);
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

            if(userRole === 'manager'){
                setUserManger(true);
            }else{
                setUserManger(false);
            }
          }
        }catch(e){
    
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
    
      const openErrorModal = () => {
        setisErrorModalOpen(true);
      };
    
      const closeErrorModal = () => {
        setisErrorModalOpen(false);
      };

      const addAnnouncement = () => {
        
      };
    
    return(
        <div className="flex dark:bg-gray-950 bg-white">  
                      
            <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar}/>
            
            <div className='flex flex-col flex-1 w-full"'>
           
                <header className='justify-content z-10 mt-5 bg-white shadow-md dark:bg-gray-950'>
                
                    <div className="flex md:justify-center flex-1 lg:mr-32">
                        <div>
                            <button className="mr-10 ml-3 rounded-lg bg-blue-200 md:hidden block dark:bg-gray-900 dark:text-white text-black p-2" onClick={toggleSidebar}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </button>
                        </div>
                        <div className=" relative w-40 justify-center md:w-full max-w-xl mr-6 focus-within:text-purple-500">
                            <div className="absolute mb-6 inset-y-0 flex items-center pl-2">
                            <svg className="w-4 h-4" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                            </svg>
                            </div>
                            <input className="w-full pl-8 pr-2 text-large dark:text-black    text-black placeholder-blue-600 bg-gray-200 border-0 rounded-md dark:placeholder-gray-500 dark:focus:shadow-outline-blue dark:focus:placeholder-gray-600 dark:bg-gray-200focus:placeholder-gray-500 focus:bg-white focus:border-red-300 focus:outline-none focus:shadow-outline-purple focus:text-blue-500 form-input" type="text" placeholder="Search" aria-label="Search"></input>
                        </div> 
                        <div className='mt-1'>
                            <DarkMode/>
                        </div> 
                        
                        <Profile/>

                    </div> 
                </header>
                <main>
                    <div className='flex flex-row'>
                        <div className='w-3/4 p-5'>
                            <div className='p-5 h-1/2 rounded-xl '>
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
                                    <button
                                        onClick={addAnnouncement}
                                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Add Announcement
                                    </button>
                                    </div>
                                )}
                                {announceData.map((data, index) => (
                                    <div key={index} className="flex p-4 border border-gray-200 rounded mb-4">
                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="font-semibold">{data.name}</span>
                                                <p className="ml-2">{data.content} | {data.team}</p>
                                            <div className="text-gray-500 text-sm">
                                                {calculateTimePassed(data.date)} 
                                            </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className='p-5 bg-slate-50 h-1/2 rounded-xl'>
                                <h1 className='text-left text-3xl font-bold dark:text-white text-gray-700'>Tasks</h1>
                            </div>
                        </div>
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