import myImage from '../images/logo.png';
import React, { useState } from 'react';
import DarkMode from './DarkMode';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn } = UserAuth();
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const openErrorModal = () => {
    setIsErrorModalOpen(true);
  };
  
  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
  };
  


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('')
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (e) {

      let errorMessage = '';
      if (e.code === 'auth/user-not-found') {
        errorMessage = 'User not found. Please check your email.';
      } else if (e.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else {
        errorMessage = e.message; // Use the original message if no specific handling is needed
      }
      setError(errorMessage);
    openErrorModal(); // Open the error modal
  console.log(errorMessage);
    }
  };

  return (
    <div className="flex relative flex-1 h-screen dark:bg-gray-900 bg-white flex-col px-6 py-12 lg:px-8">
    <div className='absolute right-5 top-5'>
    <DarkMode/> 
    </div>
               
 <div className='mt-40'>
 <div className="sm:mx-auto sm:w-full sm:max-w-sm">
   <img
     className="mx-auto h-10 w-auto"
     src={myImage}
     alt="Privo Logo"
   />
   <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight dark:text-white text-gray-900">
     Sign in to your account
   </h2>
 </div>

 <div className="mt-10 sm:mx-auto dark:bg-gray-900 sm:w-full sm:max-w-sm">
   <form className="space-y-6" onSubmit={handleSubmit} method="POST">
     <div>
       <label htmlFor="email" className="flex text-sm font-medium leading-6 dark:text-white text-gray-900">
         Email address
       </label>
       <div className="mt-2">
         <input
           id="email"
           name="email"
           type="email"
           autoComplete="email"
           placeholder='Enter your Email'
           value={email}
           onChange={(e) => setEmail(e.target.value)}
           required
           className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
         />
       </div>
     </div>

     <div >
       <div className="flex items-center justify-between">
         <label htmlFor="password" className="block text-sm font-medium leading-6 dark:text-white text-gray-900">
           Password
         </label>
         <div className="text-sm">
           <a href="/forgot-password" className="font-semibold text-blue-600 dark:hover:text-purple-400 dark:text-purple-500 hover:text-blue-500">
             Forgot password?
           </a>
         </div>
       </div>
       <div className="mt-2">
         <input
           id="password"
           name="password"
           type="password"
           value={password}
           placeholder='Enter your password'
           autoComplete="current-password"
           required
           onChange={(e) => setPassword(e.target.value)}
           className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
         />
       </div>
     </div>

     <div>
     <button
       className="flex w-full justify-center rounded-md dark:hover:bg-purple-400 dark:bg-purple-500 bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
     >
       Sign in
     </button>
       {/* <a href="/dashboard" className="font-semibold leading-6 dark:text-purple-400 text-blue-600 hover:text-blue-500">
       Sign in.
     </a> */}
     </div>
   </form>

   <p className="mt-10 text-center text-sm text-gray-500">
     Not a member?{' '}
     <Link to="/register" className="font-semibold leading-6 dark:text-purple-500 text-blue-600 dark:hover:text-purple-400 hover:text-blue-500">
       Register now.
     </Link>
   </p>
 </div>
 {isErrorModalOpen && (
        <div id="modal" className="fixed top-0 left-0 w-full h-full bg-opacity-80 bg-gray-900 flex justify-center items-center">
          <div className="bg-white dark:text-white dark:bg-gray-500 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Error!</h2>
            <p id="error-message">{error}</p>
            <button onClick={closeErrorModal} className="mt-4 bg-purple-500 hover:bg-purple-400 text-white font-semibold px-4 py-2 rounded">Close</button>
          </div>
        </div>
      )}
 
</div>
</div>


  );
};

export default Login;