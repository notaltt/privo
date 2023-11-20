import myImage from '../images/logo.png';
import React from "react";
import DarkMode from './DarkMode';
import { useState } from 'react';
import { firestore as db } from "./firebase";
import FilterableSelect from "../components-additional/FilterableSelect.js";
import { setDoc, doc, collection, getDocs, where, query } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/components/firebase';
import { Link } from 'react-router-dom';


export default function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordMatch, setIsPasswordMatch] = useState(true);
  const [company, setCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');


  const handleCompanyChange = (selectedCompany) => {
    console.log(selectedCompany)
    setCompany(selectedCompany);
  };
  
  

  const handleConfirmPasswordChange = (e) => {
    const confirmPassValue = e.target.value;
    setConfirmPassword(confirmPassValue);
    
    if (password !== confirmPassValue) {
      setIsPasswordMatch(false);
    } else {
      setIsPasswordMatch(true);
    }
  };
  
  
  
  const inputHandler = (e) => {
    const { name, value } = e.target;

    switch(name) {
        case "email":
            setEmail(value);
            break;
        case "name":
            setName(value);
            break;
        case "password":
            setPassword(value);
            break;
        case "phoneNumber":
            setPhone(value);
            break;
        case "username":
            setUsername(value);
            break;
        case "confirmPassword":
            setConfirmPassword(value);
            break;
        default:
            break;
    }
  };
  
  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigits = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
    
    return password.length >= 8 && hasUpperCase && hasLowerCase && hasDigits && hasSpecialChar;
  };

  
  const checkEmailExists = async (email) => {
    const usersRef = collection(db, 'users'); 
    const emailQuery = query(usersRef, where('email', '==', email));
    const emailSnapshot = await getDocs(emailQuery);
    return !emailSnapshot.empty;
  };
  

  const checkUsernameExists = async (username) => {
    const usersRef = collection(db, 'users'); 
    const usernameQuery = query(usersRef, where('username', '==', username));
    const usernameSnapshot = await getDocs(usernameQuery);
    return !usernameSnapshot.empty;
  };

  
  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (!validatePassword(password)) {
      alert("Password must be at least 8 characters long, contain an uppercase and lowercase letter, a number, and a special character.");
      return;
    }

    const emailExists = await checkEmailExists(email);
    const usernameExists = await checkUsernameExists(username);

    if (emailExists) {
      setEmailError("Email already exists.");
    } else {
      setEmailError("");
    }
  
    if (usernameExists) {
      setUsernameError("Username already exists.");
    } else {
      setUsernameError("");
    }
  
    if (emailExists || usernameExists) {
      setIsSubmitting(false);
      return;
    }

    if(company === "" || company === "Select Company:"){
      console.log("Select Company First");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create a new user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
      // User registration was successful
      const user = userCredential.user;
      console.log("User registered:", user);
  
      // Now, you can store additional user data in Firestore if needed
      const userData = {
        uid: user.uid,
        avatar: "null",
        email: email,
        name: name,
        phone: phone,
        role: "member",
        company: company,
        username: username,
      };
      
  
      const addUser = doc(db, 'users', user.uid);
      await setDoc(addUser, userData);

  
      setEmail("");
      setName("");
      setPassword("");
      setPhone("");
      setUsername("");
      setConfirmPassword("");
      setCompany("");
      setIsSubmitting(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error registering user:", error.message);   
      if (error.code === "auth/email-already-in-use") {
        setEmailError("Email already exists.");
      } else if (error.code === "auth/username-already-in-use") {
        setUsernameError("Username already exists.");
      }
      setIsSubmitting(false);
    }
  };
  



return (
  <>
    
      <div className="flex relative flex-1 h-screen dark:bg-gray-900 bg-white flex-col px-6 py-12 lg:px-8">
        <div className='absolute right-5 top-5'>
          <DarkMode/> 
        </div>
                    
      <div className='mt-5'>
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            className="mx-auto h-10 w-auto"
            src={myImage}
            alt="Privo Logo"
          />
          <h2 className="mt-5 text-center text-2xl font-bold leading-9 tracking-tight dark:text-white text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-5 sm:mx-auto dark:bg-gray-900 sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={submitHandler}>
            <div>
              <label htmlFor="email" className="flex text-sm font-medium leading-6 dark:text-white text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  placeholder="Email@something.com"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={inputHandler}
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
              {emailError && <p className="text-red-500">{emailError}</p>}
            </div>

          <div >
            <div className="flex items-center justify-between">
              <label htmlFor="name" className="block text-sm font-medium leading-6 dark:text-white text-gray-900">
                Name
              </label>
            </div>
            <div className="mt-2">
              <input
                placeholder="firstName lastName"
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={inputHandler}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div >
            <div className="flex items-center justify-between">
              <label htmlFor="username" className="block text-sm font-medium leading-6 dark:text-white text-gray-900">
                Username
              </label>
            </div>
            <div className="mt-2">
              <input
                placeholder="Username"
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={inputHandler}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
            {usernameError && <p className="text-red-500">{usernameError}</p>}
          </div>

          <div >
            <div className="flex items-center justify-between">
              <label htmlFor="phonenumber" className="block text-sm font-medium leading-6 dark:text-white text-gray-900">
                Phone Number
              </label>
            </div>
            <div className="mt-2">
              <input
                placeholder="Phone number"
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                pattern="[0-9]{11}"
                value={phone}
                onChange={inputHandler}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div >
            <div className="flex items-center justify-between">
                <label htmlFor="Company" className="block text-sm font-medium leading-6 dark:text-white text-gray-900">
                    Company
                </label>
            </div>
            <div className="mt-2">              
                <FilterableSelect onTeamChange={handleCompanyChange} />
            </div>
          </div>

          <div className="flex mt-2">
            <div className="flex-1 mr-2"> 
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium leading-6 dark:text-white text-gray-900">
                  Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  placeholder="Password"
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={inputHandler}
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 dark:text-white text-gray-900">
                      Confirm Password
                  </label>
              </div>
              <div className="mt-2">
                  <input
                      placeholder="Confirm Password"
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      required
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  />
                  {!isPasswordMatch && <p style={{ color: "red" }}>Passwords do not match!</p>}
              </div>
            </div>

          </div>

          <div>
            <button
              href="/login"
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md dark:bg-purple-500 bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Register
            </button>
            <Link to="/login" className="font-semibold leading-6 dark:text-purple-400 text-blue-600 hover:text-blue-500">
              back to login page
            </Link>
          </div>
        </form>

      </div>
      </div>
      
    </div>
    
  </>
)
}
  