import React, { useState, useEffect } from 'react';
import AvatarUpload from './AvatarUpload';
import { UserAuth } from '../context/AuthContext';
import { updateUserDataByUid, getUserDataByUid } from './userDataUtils';
import DarkMode from './DarkMode';

const UpdateProfileForm = () => {
  const { user } = UserAuth();
  const [name, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');  
    
  useEffect(() => {
    if (user) {
      setDisplayName(user.name); // Use user.name if available, otherwise use an empty string
      setPhone(user.phone);
      setUsername(user.username);
    }
  }, [user]);

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
    <div className='bg-gray-100 dark:text-white dark:bg-gray-900 overflow-y-hidden'>

      <header className='relative dark:text-white justify-content  py-8 bg-white shadow-md dark:bg-gray-950'>
            <div className='absolute mt-5 right-5 top-0'>
              <DarkMode/>
            </div>
            <div className='absolute  mt-5 left-0 top-0'>
              <a href="/dashboard" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-4">
              Dashboard
                </a>
            </div>
              
          
          <div className="flex md:justify-center flex-1 lg:mr-32">
             
          </div>                 
      </header>

      
      
        <div className="flex justify-between items-center dark:bg-gray-900 rounded bg-gray-100 min-h-screen">
              
        <div className="mx-auto max-w-md p-6 dark:text-white dark:bg-gray-950 bg-white rounded-lg shadow-lg">
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-bold text-indigo-600">Welcome, {user && user.email}</h1>
          </div>
          <AvatarUpload />
          <form className="dark:bg-gray-950 dark:text-white py-3 space-y-4" onSubmit={handleFormSubmit}>
            <div>
              <label htmlFor="name" className="dark:text-white text-gray-700 font-semibold">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                placeholder="Name"
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-indigo-400"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-indigo-400"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-indigo-400"
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
    
  );
};

export default UpdateProfileForm;
