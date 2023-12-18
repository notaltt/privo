import React, { useState, useEffect, useCallback } from 'react';
import SideBar from './SideBar';
import Profile from './Profile-Menu';
import DarkMode from './DarkMode';
import {generateDate, months } from '../components-additional/GenerateDate';
import dayjs from "dayjs";
import cn from '../components-additional/cn'
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import { firestore as db } from './firebase'; 
import { collection, addDoc, getDocs, where, query, doc,  getDoc, Timestamp, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../../src/components/firebase';
import { Toaster, toast } from 'sonner'
import myImage from '../images/logoOpacity.png';
import noPic from '../images/nopic.png'
import { getStorage, getDownloadURL, ref } from 'firebase/storage';

function Tasks({ user }) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const currentDate = dayjs();
	const [today, setToday] = useState(currentDate);
	const [selectDate, setSelectDate] = useState(currentDate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalTaskOpen, setIsModalTaskOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState();
  const [userCompany, setUserCompany] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [joinedTeams, setJoinedTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [users, setUsers] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const storage = getStorage();

  const handleUserChange = (event) => {
    setSelectedUserEmail(event.target.value);
  };
  
  const hasTasksForDate = (checkDate) => {
    return tasks.some(task => task.date === checkDate.format('YYYY-MM-DD'));
  };

  const fetchTasks = async (teamId) => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'tasks'), where('team', '==', teamId));
      const snapshot = await getDocs(q);
  
      const userUids = new Map();
      const userQuerySnapshot = await getDocs(collection(db, 'users'));
      userQuerySnapshot.forEach((userDoc) => {
        userUids.set(userDoc.data().email, userDoc.id);
      });
  
      // Then, fetch the tasks and their assigned user's profile picture URLs
      const tasksWithProfilePicsPromises = snapshot.docs.map(async (doc) => {
        const taskData = doc.data();
        const assignedUserEmail = taskData.assignedUser;
        const userUid = userUids.get(assignedUserEmail); // Get the UID from the map
        let profilePicUrl = '';
  
        if (userUid) {
          try {
            // Attempt to fetch the profile picture URL
            const profilePicRef = ref(storage, `${userUid}.png`);
            profilePicUrl = await getDownloadURL(profilePicRef);
          } catch (error) {
            // If there's any error (e.g., file not found), use a placeholder image
            console.error(`Error fetching profile picture for UID ${userUid}:`, error);
            profilePicUrl = noPic;
          }
        } else {
          console.error(`No UID found for assigned user with email ${assignedUserEmail}`);
          profilePicUrl = noPic;
        }
  
        console.log(profilePicUrl);
        return {
          id: doc.id,
          taskName: taskData.taskName,
          assignedUser: assignedUserEmail,
          date: taskData.deadline,
          dateAdded: taskData.createdAt,
          description: taskData.description,
          profilePicUrl: profilePicUrl,
        };
      });
  
      // Wait for all the profile picture URLs to be fetched
      const tasksWithProfilePics = await Promise.all(tasksWithProfilePicsPromises);
  
      setTasks(tasksWithProfilePics);
    } catch (error) {
      console.error("Error fetching tasks with profile pictures:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  
  useEffect(() => {
    if (selectedTeam) {
      fetchTasks(selectedTeam);
    } else {
      setTasks([]); // Clear tasks if no team is selected
    }
  }, [selectedTeam, lastUpdate]); // Add lastUpdate as a dependency
  

  const filterTasksBySelectedDate = (selectedDate) => {
    const formattedDate = selectedDate.format('YYYY-MM-DD');
    const filteredTasks = tasks.filter(task => task.date === formattedDate);
  
    setTasksForSelectedDate(filteredTasks);
  };
  
  useEffect(() => {
    if (selectDate) {
      filterTasksBySelectedDate(selectDate);
    }
  }, [selectDate, tasks]);
  

  useEffect(() => {
    const fetchData = async (user) => {
      if (user) {
        getUser(user);
        fetchTeam(user);
        fetchUsers(user);
        checkUserRole(user);
        setHasFetched(true);
        setIsLoading(false); 
      } else {
        console.log("User is not authenticated.");
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!hasFetched) {
        setCurrentUser(user);
        fetchData(user);
      }
    });

    return () => unsubscribe();
  }, [hasFetched]);
  
  
  const getUser = async (user) => {
    try {
      const userData = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userData);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userName = userData.name;
        const userRole = userData.role;
  
        setUserName(userName);
        setUserRole(userRole);

      }
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
  };
  
  const checkUserRole = async (user) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
  
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        const userRole = userData.role;
  
        if (userRole === "manager") {
          setIsManager(true);
          console.log(userRole);
          console.log("User is a manager");
        } else if (userRole === "member") {
          setIsManager(false);
          console.log(userRole);
          console.log("User is a member");
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error);
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
        const userCompany = userData.company;

        const teamRef = collection(db, 'team');
        const teamQuery = query(teamRef, where('teamName', 'array-contains-any', userTeams), where('fromCompany', '==', userCompany));
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
  };

  
 
  const fetchUsers = async (user, selectedTeam) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);
  
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const userCompany = userData.company;
  
        const companyRef = collection(db, 'users');
        const companyQuery = query(companyRef, where('company', '==', userCompany));
        const companySnapshot = await getDocs(companyQuery);
  
        const users = companySnapshot.docs
          .map((doc) => doc.data())
          .filter((user) => user.teams && user.teams.includes(selectedTeam));
 
        setUsers(users);
        console.log(users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const addTask = async (event) => {
    event.preventDefault();
    try {
      if (!selectedTeam || !taskName || !taskDate || !selectedUserEmail || !taskDescription) {
        toast.error('Incomplete task details. Please fill in all fields.');
        return;
      }
  
      if (selectedUserEmail === '') {
        toast.error('Please select a user to assign the task.');
        return;
      }
  
      const tasksCollection = collection(db, 'tasks');
  
      await addDoc(tasksCollection, {
        team: selectedTeam,
        taskName: taskName,
        deadline: taskDate,
        assignedUser: selectedUserEmail,
        description: taskDescription,
        createdAt: Timestamp.now(),
      });
      
      toast.success('Successfully added task');
      closeModal(); // Make sure this function is called after successful addition
      setLastUpdate(Date.now()); // Update lastUpdate state to trigger refresh
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Error adding task.'); // Display an error toast
    }
  };

  const deleteTaskFromFirestore = async (taskId) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await deleteDoc(taskRef);
      toast.success('Successfully removed task');
    } catch (error) {
      console.error("Error deleting task from Firestore:", error);
      toast.success("Error removing task");
      // Handle the error
    }
  };
  
  

  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  const openModal = (task) => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);    // Set the selected task for use in the modal
    setIsModalTaskOpen(true); // Open the task details modal
  };

  const closeTaskModal = () => {
    setIsModalTaskOpen(false);
    setShowConfirmation(false); // Close the confirmation dialog
  };

  const handleDeleteTask = () => {
    setShowConfirmation(true);
  };

  const confirmDeleteTask = () => {
    if (selectedTask) {
      deleteTaskFromFirestore(selectedTask.id)
        .then(() => {
          closeTaskModal();
          closeModal(); // Make sure this function is called after successful addition
          setLastUpdate(Date.now()); // Update lastUpdate state to trigger refresh
          window.location.reload(); // Reload the page after successful deletion
        })
        .catch((error) => {
          console.error("Error deleting task:", error);
          // Handle error
        });
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      // Clicked on the backdrop (outside the modal)
      closeTaskModal();
      closeModal();
    }
  };

  console.log(generateDate());
 
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };



  return(
    <div className="flex dark:text-white  bg-no-repeat bg-right-bottom dark:bg-gray-950 h-screen overflow-hidden': isSideMenuOpen }" style={{ backgroundImage: `url(${myImage})` }}>   
    <Toaster richColors expand={false} position="bottom-center"/>        
    <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar}/>
    <div className='flex flex-col flex-1 w-full"'> 
      <header className='justify-content z-10 pt-4 bg-white shadow-md dark:bg-gray-900'>
        <div className="flex md:justify-center flex-1 lg:mr-32">
              <div className=" relative  w-40 justify-center md:w-full max-w-xl mr-6 focus-within:text-purple-500">
              <div className=''>
                <select
                  className="w-full hover:dark:bg-gray-100 pl-8 pr-2 text-large dark:text-black ..."
                  aria-label="Choose Team"
                  value={selectedTeam}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    console.log(selectedId);
                    setSelectedTeam(selectedId); // Set the selected team ID
                    fetchUsers(currentUser, selectedId); // Fetch users for the selected team
                  }}
                  id="team-select"
                >
                  <option value="" disabled selected>Please Select Team:</option> {/* Add default option */}
                  {joinedTeams && joinedTeams.length > 0 ? (
                    joinedTeams.map((team) => (
                      <option key={team.id} value={team.teamName}>
                        {team.teamName} {/* Display team name as an option */}
                      </option>
                    ))
                  ) : (
                    <option disabled>No teams available or you're not part of any teams.</option>
                  )}
                </select>
            </div>
            </div> 
            <div>
            {isManager && ( // This will only render the button if isManager is true
              <button
                className="mt-0 ml-5 mr-5 gap-10 h-12 w-32 flex-none rounded-full bg-sky-300 hover:bg-cyan-200 me-4 font-semibold"
                onClick={openModal}
              >
                Add Task
              </button>
            )}
            </div>
            <div className='mt-2 position-absolute right-0'>
              <DarkMode/>
            </div> 
            <Profile/>
          </div> 
      </header>
      <main>
          {/* <div className="w-96 h-96">
            <h1 className="font-semibold">Recently Added Tasks</h1>
            {tasks.length > 0 ? (
              <div className="mt-4">
                {tasks.map((task, index) => (
                  <div key={index} className="border rounded p-2 mb-4">
                    <h3 className="font-semibold">{task.taskName}</h3>
                    <p>Assigned to: {task.assignedUser}</p>
                    <p>Date: {task.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No tasks added yet.</p>
            )}
          </div> */}
        <div className="mt-10 flex flex-nowrap sm:divide-x-2 w-full justify-center  ">
          <div className="flex-none w-1/3 px-5 overflow-hidden">
            <div className="flex justify-between items-center">
              <h1 className="select-none font-semibold">
                {months[today.month()]}, {today.year()}
              </h1>
              <div className="flex gap-10 items-center ">
                <GrFormPrevious
                  className="w-5 h-5  dark:bg-gray-900 cursor-pointer hover:scale-105 transition-all"
                  onClick={() => {
                    setToday(today.month(today.month() - 1));
                  }}
                />
                <h1
                  className=" cursor-pointer  hover:scale-105 transition-all"
                  onClick={() => {
                    setToday(currentDate);
                  }}
                >
                  Today
                </h1>
                <GrFormNext
                  className="w-5 h-5 dark:bg-gray-900 cursor-pointer hover:scale-105 transition-all"
                  onClick={() => {
                    setToday(today.month(today.month() + 1));
                  }}
                />
              </div>
            </div>
            <div className="grid dark:text-white grid-cols-7 ">
              {days.map((day, index) => {
                return (
                  <h1
                    key={index}
                    className="text-sm text-center  h-14 w-14 grid place-content-center text-gray-500 select-none"
                  >
                    {day}
                  </h1>
                );
              })}
            </div>

            <div className=" grid dark:text-white grid-cols-7">
              {generateDate(today.month(), today.year()).map(({ date, currentMonth, today }, index) => {
                const dateHasTasks = hasTasksForDate(date);
                
                return (
                  <div
                    key={index}
                    className="p-2 text-center h-14 grid place-content-center text-sm border-t"
                  >
                    <h1
                      className={cn(
                        "h-10 w-10 rounded-full grid place-content-center hover:dark:bg-gray-100  hover:dark:text-black hover:bg-black hover:text-white transition-all cursor-pointer select-none",
                        currentMonth ? "" : "text-gray-400",
                        selectDate.toDate().toDateString() === date.toDate().toDateString()
                          ? "bg-black text-white" // Selected date
                          : dateHasTasks ? "bg-gray-300" : "", // Other dates with tasks
                        today && selectDate.toDate().toDateString() !== date.toDate().toDateString()
                          ? "bg-blue-600 dark:bg-purple-600 text-white" // Today's date, not selected
                          : ""
                      )}
                      onClick={() => {
                        setSelectDate(date);
                      }}
                    >
                      {date.date()}
                    </h1>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex-none w-2/3 px-5  overflow-hidden">
            <h1 className="font-semibold">Tasks for {selectDate.toDate().toDateString()}</h1>
            <div className="flex flex-wrap justify-center gap-4 mt-5">
              {tasksForSelectedDate.length > 0 ? (
                tasksForSelectedDate.map((task, index) => (
                <div key={index} className="w-full sm:w-1/2 lg:w-1/3 p-4">
                  <div className="bg-white rounded-lg shadow-lg dark:bg-gray-800 overflow-hidden" onClick={() => openTaskModal(task)}>
                    <div className="flex justify-center">
                      <img
                        className="object-cover w-20 h-20 border-2 border-blue-500 rounded-full dark:border-blue-400"
                        alt="Assigned User"
                        src={task.profilePicUrl} // This should refer to the profile picture URL
                      />
                    </div>

                    <div className="p-4">
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white truncate">
                        {task.taskName}
                      </h2>

                      <p className="text-sm text-gray-600 dark:text-gray-200 truncate">
                        {task.description}
                      </p>
                    </div>

                    <div className="p-4">
                      <a className="text-lg font-medium text-blue-600 dark:text-blue-300" tabIndex="0">
                        {task.assignedUser}
                      </a>
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <p>No tasks for this date.</p>
              )}
            </div>
          </div>
        </div>

        {isModalTaskOpen && selectedTask && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50"  onClick={handleBackdropClick} >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden max-w-lg w-full mx-4">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Task Name: {selectedTask.taskName}</h3>
                <h1 className="text-gray-700 dark:text-gray-300">
                  Date added: {selectedTask.dateAdded?.toDate().toLocaleDateString('en-US')}
                </h1>
                <h1 className="text-gray-700 dark:text-gray-300">
                  Deadline: {dayjs(selectedTask.date).format('MM/DD/YYYY')}
                </h1>
                <h1 className="text-gray-700 dark:text-gray-300">Assigned to: {selectedTask.assignedUser} </h1>
                
                <div className="border border-gray-300 dark:border-gray-700 p-3 rounded-md">
                <p className="text-gray-700 dark:text-gray-300">{selectedTask.description}</p>
                </div>
                
                <div className="mt-4">
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    onClick={handleDeleteTask}
                  >
                    Delete Task
                  </button>
                </div>
                {showConfirmation && (
                <div className="mt-4">
                  <p>Are you sure you want to delete this task?</p>
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    onClick={confirmDeleteTask}
                  >
                    Confirm Delete
                  </button>
                  <button
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-2"
                    onClick={closeTaskModal}
                  >
                    Cancel
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>
        )}

        


        {isModalOpen && (
          <div id="modal" className="fixed top-0 left-0 w-full h-full bg-opacity-80 bg-gray-900 flex justify-center items-center" onClick={handleBackdropClick}>
            <div className="bg-white dark:text-white dark:bg-gray-500 rounded-lg shadow-lg p-12">
              <div className="flex flex-col w-full h-full justify-start items-start">
                <h1 className="font-semibold">Team: {selectedTeam}</h1>
              </div>
              <form className="space-y-6">
                <div className="flex space-x-6">
                  <div className="flex-1">
                    <label htmlFor="taskName" className="flex text-lg font-medium leading-6 dark:text-white text-gray-900 items-stretch">
                      Task Name
                    </label>
                    <div className="mt-2">
                      <input
                        placeholder="Task Name"
                        id="taskName"
                        name="taskName"
                        type="text"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        required
                        className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-lg sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="date" className="flex text-lg font-medium leading-6 dark:text-white text-gray-900 items-stretch">
                      Date
                    </label>
                    <div className="mt-2">
                      <input
                        placeholder="Date"
                        id="date"
                        name="date"
                        type="date"
                        value={taskDate}
                        onChange={(e) => setTaskDate(e.target.value)}
                        required
                        className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-lg sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div className='flex-1'>
                    <label htmlFor="date" className="flex text-lg font-medium leading-6 dark:text-white text-gray-900 items-stretch">
                      Assign a user
                    </label>
                    <div className='mt-2'>
                    <select
                      name='users'
                      id='users'
                      value={selectedUserEmail}
                      onChange={handleUserChange}
                      required
                      className="block w-full px-4 py-2 border rounded-lg mt-1"
                    >
                      <option value="">Please assign a user</option>
                      {users.map((user, index) => (
                        <option key={index} value={user.email}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                    </div>
                  </div>
                </div>
                <label htmlFor="description" className="flex text-lg font-medium leading-6 dark:text-white text-gray-900 items-stretch">
                  Description
                </label>
                <div className="mt-2">
                  <textarea
                    placeholder="Description of Task"
                    id="description"
                    name="description"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    required
                    className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-lg sm:text-sm sm:leading-6"
                  />
                </div>
                <button
                  onClick={addTask}
                  disabled={!selectedTeam || !taskName || !taskDate || !selectedUserEmail || !taskDescription}
                  className="mt-4 bg-sky-300 hover:bg-cyan-200 text-white font-semibold px-6 py-3 rounded"
                >
                  Add
                </button>
              </form>
              <div class="aa de dn md aue avb bxo">
                <button type="button" class="adu alo axp bkx bmz bne bnq bog" onClick={closeModal}>
                  <span class="t">
                    ......
                  </span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" class="oc se">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
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

export default Tasks;