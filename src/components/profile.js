import React, { useState, useEffect } from 'react';
import AvatarUpload from './AvatarUpload';
import { UserAuth } from '../context/AuthContext';
import { updateUserDataByUid, getUserDataByUid } from './userDataUtils';
import DarkMode from './DarkMode';
import SideBar from './SideBar';
import myImage from '../images/logoOpacity.png';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const UpdateProfileForm = () => {
  const { user } = UserAuth();
  const [name, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const auth = UserAuth();
  const [userData, setUserData] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);


  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  }

  useEffect(() => {
    if (user) {
      setDisplayName(user.name); // Use user.name if available, otherwise use an empty string
      setPhone(user.phone);
      setUsername(user.username);
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
  }, [user],[auth]);

 

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const userData = await getUserDataByUid(user.uid);

      if (userData) {
        await updateUserDataByUid(user.uid, {
          name: name,
          phone: phone,
          username: username,
        });
        alert('Profile updated successfully!');
      } else {
        alert('User not found');
      }
    } catch (error) {
      console.error('Error updating profile: ', error);
      alert('An error occurred while updating profile.');
    }
  };

  return (
    <div className="flex bg-no-repeat bg-right-bottom dark:bg-gray-950 h-screen" style={{ backgroundImage: `url(${myImage})` }}> 

            <header className='overflow-y-hidden dark:text-white justify-content  py-8 bg-white shadow-md dark:bg-gray-950'>
                  <div className='absolute mt-5 right-5 top-0'>
                    <DarkMode/>
                  </div>
            </header>

        <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
        <div className="flex justify-between items-center w-full dark:bg-gray-950 rounded bg-gray-100 pt-14">
              
        <div className="mx-auto max-w-md p-6 dark:text-white dark:bg-gray-950  bg-white  rounded-lg shadow-lg">
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-bold text-indigo-600">Welcome, {user && user.email}</h1>
          </div>

          <div className='py-4 mt-10'>
            <h2 className="text-xl text-left font-extrabold text-indigo-600">User Information:</h2>
            <h3 className="text-xl text-left text-balck">Name:</h3>
             <p className="text-lg capitalize p-0 m-0 text-left text-balck">{userData.name}</p>
            <h3 className="text-xl text-left text-balck">Username:</h3>
            <p className="text-lg p-0 m-0 text-left text-balck">{userData.username}</p>
            <h3 className="text-xl text-left text-balck">Contact No</h3>
            <p className="text-lg p-0 m-0 text-left text-balck">{userData.phone}</p>
            <h3 className="text-xl text-left text-balck">Company</h3>
            <p className="text-lg p-0 m-0 text-left text-balck">{userData.company}</p>
          </div>
          
          
          <button
          onClick={openModal}
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
        >
          Edit Profile
        </button>

        {isModalOpen && (
        <div className="fixed left-64 inset-0 z-10 overflow-y-auto">
          <div className="flex items-end left-20 justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={closeModal}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="dark:bg-gray-900 bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className=" sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-2xl leading-6 font-medium dark:text-white text-black"
                      id="modal-title"
                    >
                      Edit Profile
                    </h3>
                    <div className="mt-2 left-10">
                        <AvatarUpload/>
                        <form className="dark:bg-gray-900 bg-gray-200 dark:text-white  space-y-4" onSubmit={handleFormSubmit}>
                            <div>
                              <label htmlFor="name" className="dark:text-white text-gray-700 font-semibold">Name</label>
                              <input
                                id="name"
                                type="text"
                                value={name}
                                placeholder="Name"
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg  dark:bg-gray-400 focus:ring focus:ring-indigo-400"
                              />
                            </div>
                            <div>
                              <label htmlFor="username" className="text-gray-700 dark:text-white  font-semibold">Username</label>
                              <input
                                id="username"
                                type="text"
                                value={username}
                                placeholder="Username"
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-3 border dark:bg-gray-400  border-gray-300 rounded-lg focus:ring focus:ring-indigo-400"
                              />
                            </div>
                            <div>
                              <label htmlFor="phone" className="text-gray-700 dark:text-white font-semibold">Phone Number</label>
                              <input
                                id="phone"
                                type="text"
                                value={phone}
                                placeholder="Phone Number"
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full p-3 border border-gray-300  dark:bg-gray-400 rounded-lg focus:ring focus:ring-indigo-400"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full py-3 dark:bg-purple-500 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:ring focus:ring-indigo-400"
                            >
                              Update Profile
                            </button>
                          </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dark:bg-gray-900 bg-gray-100 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={closeModal}
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 dark:bg-purple-500 bg-blue-500 text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
          
        </div>
      </div>
    </div>
    
  );
};

export default UpdateProfileForm;
