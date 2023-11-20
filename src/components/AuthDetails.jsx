import React, { useEffect, useState } from 'react';
import { auth } from "../../src/components/firebase";


const AuthDetails = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Add a Firebase authentication state change listener
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        // User is signed in.
        setUser(authUser);
      } else {
        // User is signed out.
        setUser(null);
      }
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, <span className='text-lg'>{user.email}</span></p>
          {/* Add additional user details here */}
        </div>
      ) : (
        <p>No user is signed in.</p>
      )}
    </div>
  );
};

export default AuthDetails;
