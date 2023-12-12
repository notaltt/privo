import React, { useState } from 'react';
import TeamLogo from '../images/user-group.svg';
import { uploadTeam } from "./firebase";

const ChangeTeamPhoto = ({ isOpen, hide, team }) => {
    const [photo, setPhoto] = useState(null);
    const [photoURL, setPhotoURL] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        if (e.target.files[0]) {
            console.log("fuck you", e);
            setPhoto(e.target.files[0]);
        }
    }

    const handleClick = () => {
        uploadTeam(photo, team, setPhotoURL, setLoading);
    };

    if(!isOpen) return(<></>);
    return (
    <div className="fixed inset-0 flex items-center justify-center z-50" >
        <div className="absolute inset-0 bg-black opacity-80" onClick={hide}></div>
        <div className="bg-white rounded-md shadow-md p-6 z-10">
            <h1 className='font-bold text-2xl'>Edit Team Photo</h1>
            <label htmlFor="avatarInput" className="cursor-pointer">
                <input type="file" id="avatarInput" onChange={handleChange} className="hidden" />
                <div className="m-6">
                    <img src={photoURL} alt="Avatar" className="w-52 h-52 rounded-full cursor-pointer" />
                </div>
            </label>
            <button
                disabled={loading || !photo}
                onClick={handleClick}
                className="bg-blue-500 dark:bg-purple-500 hover:bg-blue-700 text-white font-bold py-2 px-4 me-4 rounded"
            >Upload</button>
            <button
                onClick={hide}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >Close</button>

        </div>
    </div>
    );
};

export default ChangeTeamPhoto;
