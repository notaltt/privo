// GoogleProfileMenu.js
import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { useAuth } from './firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const ProfileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const currentUser = useAuth();
    const { user, logout } = UserAuth();
    const navigate = useNavigate();
    const [photoURL, setPhotoURL] = useState("https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png");

    const auth = UserAuth();
    const [userData, setUserData] = useState(null);

   
        useEffect(() => {
            if (currentUser?.photoURL) {
              setPhotoURL(currentUser.photoURL);
            }

            const fetchUserData = async () => {
              if (auth && auth.user && auth.user.uid) {
                const firestore = getFirestore();
                const userRef = doc(firestore, 'users', auth.user.uid);
            
                try {
                  const userDoc = await getDoc(userRef);
                  if (userDoc.exists()) {
                    setUserData(userDoc.data());
                  } else {
                    console.log('User document does not exist');
                  }
                } catch (error) {
                  console.error('Error fetching user data:', error);
                }
              }
            };fetchUserData()

          },[currentUser])
  
          const handleLogout = async () => {
            try {
              await logout();
              navigate('/login');
              console.log('You are logged out')
            } catch (e) {
              console.log(e.message);
            }
          };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <button
        onClick={toggleMenu}
        className="flex items-center right-4 top-6 absolute space-x-2 cursor-pointer focus:outline-none"
      >
        <img className="w-8 h-8 rounded-full" alt='profile' src={photoURL}></img>
      </button>

      {isOpen && (
        <div className="absolute dark:text-white right-0 top-14 mt-2 w-48 bg-white border border-purple-300 dark:bg-gray-900 rounded shadow-lg">
          <ul
            role="menu"
            data-popover="profile-menu"
            data-popover-placement="bottom"
            className="dark:bg-gray-950 absolute z-10 flex min-w-[180px] flex-col gap-2 overflow-auto rounded-md border border-blue-gray-50 dark:border-gray-950 bg-white p-3 font-sans text-sm font-normal text-blue-gray-500 shadow-lg shadow-blue-gray-500/10 focus:outline-none"
            >
            <p className="text-gray-800 font-bold dark:text-white text-lg capitalize">{userData.name}</p>
            

            <hr class="my-2 dark:border-purple-300  border-blue-gray-50" tabindex="-1" role="menuitem" />
            <a
                tabIndex="-1"
                href="/profile"
                role="menuitem"
                class="flex w-full cursor-pointer text-xl items-center gap-2 rounded-md px-3 pt-[9px] pb-2 text-start leading-tight outline-none transition-all hover:bg-gray-200 hover:bg-opacity-80 hover:text-black focus:bg-blue-gray-50 focus:bg-opacity-80 focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900 hover:dark:bg-purple-300"
            >
                <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                aria-hidden="true"
                class="h-4 w-4"
                >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
                </svg>
                <p class="hover:dark:text-black block font-sans text-sm font-normal leading-normal text-inherit antialiased">
                My Profile
                </p>
            </a>
            
            {/* <a
                tabIndex="-1"
                role="menuitem"
                class="flex w-full cursor-pointer  items-center gap-2 rounded-md px-3 pt-[9px] pb-2 text-start leading-tight outline-none transition-all hover:bg-gray-200 hover:bg-opacity-80 hover:text-black focus:bg-blue-gray-50 focus:bg-opacity-80 focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900 hover:dark:bg-purple-300"
            >
                <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                aria-hidden="true"
                class="h-4 w-4"
                >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                ></path>
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
                </svg>
                <p class="hover:dark:text-black block font-sans text-sm font-normal leading-normal text-inherit antialiased">
                Settings
                </p>
            </a> */}
            <hr class="my-2 dark:border-purple-300 border-blue-gray-50" tabindex="-1" role="menuitem" />
            <a
                onClick={handleLogout}
                tabIndex="-1"
                role="menuitem"
                class="flex w-full cursor-pointer  items-center gap-2 rounded-md px-3 pt-[9px] pb-2 text-start leading-tight outline-none transition-all hover:bg-gray-200 hover:bg-opacity-80 hover:text-black focus:bg-blue-gray-50 focus:bg-opacity-80 focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900 hover:dark:bg-purple-300"
            >
                <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                aria-hidden="true"
                class="h-4 w-4"
                >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5.636 5.636a9 9 0 1012.728 0M12 3v9"
                ></path>
                </svg>
                <p class="hover:text-black block font-sans text-sm font-normal leading-normal text-inherit antialiased">
                Sign Out
                </p>
            </a>
        </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
