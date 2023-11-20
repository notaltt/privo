import SideBar from './SideBar';
import FileUpload from './FileUpload';
import Profile from './Profile-Menu';
import DarkMode from './DarkMode';
import FileList from './FileList';
import {ReactComponent as CloudIcon} from '../images/cloudicon.svg';
import { useState, useEffect } from 'react';
import { firestore as db } from './firebase'; 
import { auth } from '../../src/components/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, where, query, doc,  getDoc } from "firebase/firestore";
import myImage from '../images/logoOpacity.png';


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

    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    }

    const handleTeamClick = (selectedTeamName) => {
        setTeamName(selectedTeamName);
        setShowJoinedTeams(true);
        setFileListKey((prevKey) => prevKey + 1);
    };

    const clickJoinTeam = (teamName) => {
        setSelectedTeam((prevTeam) => (prevTeam === teamName ? null : teamName));
        setTeamName('');
    };

    const getUserCompany = async (user) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            const userUid = await getDoc(userRef);
        
            if (userUid.exists) {
                const userData = userUid.data();
                const userCompany = userData.company;
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

    const member = (length) => {
        return length === 1 ? " member" : " members";
    };
  
    return(
        <div className="flex bg-no-repeat bg-right-bottom dark:bg-gray-950 h-screen overflow-hidden': isSideMenuOpen }" style={{ backgroundImage: `url(${myImage})` }}>   
           
           <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

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
                    <div className=" relative w-40 md:w-full max-w-xl mr-6 focus-within:text-purple-500">
                        <div className="absolute mb-6 inset-y-0 flex items-center pl-2">
                        <svg className="w-4 h-4" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                        </svg>
                        </div>
                        <input className="w-full pl-8 pr-2 text-large dark:text-black    text-black placeholder-blue-600 bg-gray-200 border-0 rounded-md dark:placeholder-gray-500 dark:focus:shadow-outline-blue dark:focus:placeholder-gray-600 dark:bg-gray-200 focus:placeholder-gray-500 focus:bg-white focus:border-red-300 focus:outline-none focus:shadow-outline-purple focus:text-blue-500 form-input" type="text" placeholder="Search" aria-label="Search"></input>
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
                                <div className='flex'>
                                    <input
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                                        type="text"
                                        placeholder="Enter Team Code"
                                    />
                                    <button className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md">
                                        JOIN
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
       
    )
}