import { useAuth, upload } from "./firebase";
import { useEffect, useState } from "react";

export default function AvatarUpload() {
  const currentUser = useAuth();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoURL, setPhotoURL] = useState("https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png");

  function handleChange(e) {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0])
    }
  }

  function handleClick() {
    upload(photo, currentUser, setLoading);
  }

  useEffect(() => {
    if (currentUser?.photoURL) {
      setPhotoURL(currentUser.photoURL);
    }
  }, [currentUser])

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <input type="file" onChange={handleChange} className="mb-2" />
      <button
        disabled={loading || !photo}
        onClick={handleClick}
        className="bg-blue-500 dark:bg-purple-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Upload
      </button>
      <img src={photoURL} alt="Avatar" className="w-32 h-32 rounded-full" />
    </div>
  );
}
