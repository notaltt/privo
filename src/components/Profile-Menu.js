      import React, { useState, useEffect} from 'react';
      import AuthDetails from "./AuthDetails"
      import { useNavigate } from 'react-router-dom';
      import { UserAuth } from '../context/AuthContext';
      import { useAuth } from './firebase';

      export default function Dashboard(){
        const currentUser = useAuth();
        const { user, logout } = UserAuth();
        const navigate = useNavigate();
        const [photoURL, setPhotoURL] = useState("https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png");

        useEffect(() => {
          if (currentUser?.photoURL) {
            setPhotoURL(currentUser.photoURL);
          }
        }, [currentUser])

        const handleLogout = async () => {
          try {
            await logout();
            navigate('/login');
            console.log('You are logged out')
          } catch (e) {
            console.log(e.message);
          }
        };
          const [open,setOpen] = useState(false)
          return(
            <div className='menu-contianer'>
            <div className='menu-trigger' onClick={()=>{setOpen(!open)}}>
                <img alt='profile' src={photoURL}></img>
            </div>
            <div className={`dropdown-menu   ${open? 'active' : 'inactive'}`} >
                <h3 className='text-xm'><AuthDetails /></h3>
                <ul>
                    <DropdownItem text = {"My Profile"} href='/profile'/>
                  
                </ul>
                <button className='hover:text-red-800' onClick={handleLogout}>Logout</button>
            </div>
            
        </div>
          );
      }
      function DropdownItem(props){
          return(
              <li>
                  <a href={props.href}>{props.text}</a>
              </li>
          )
      }                 
                       