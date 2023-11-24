import React, { useState, useEffect, useCallback } from 'react';
import SideBar from './SideBar';
import Profile from './Profile-Menu';
import DarkMode from './DarkMode';
import {generateDate, months } from '../components-additional/GenerateDate';
import dayjs from "dayjs";
import cn from '../components-additional/cn'
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import { firestore as db } from './firebase'; 
import { collection, addDoc, getDocs, where, query, doc,  getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../../src/components/firebase';

function Tasks({ user }) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const currentDate = dayjs();
	const [today, setToday] = useState(currentDate);
	const [selectDate, setSelectDate] = useState(currentDate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState();
  const [userCompany, setUserCompany] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [joinedTeams, setJoinedTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userRole, setUserRole] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState([]); 

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
    
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        taskName: doc.data().taskName,
        assignedUser: doc.data().assignedUser,
        date: doc.data().date,
        description: doc.data().description
      }));
    
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
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
  }, [selectedTeam]);

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
        const userAvatar = userData.avatar;
        const userName = userData.name;
        const userRole = userData.role;
  
        setUserName(userName);
        setUserAvatar(userAvatar);
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
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);
  
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const userCompany = userData.company;
  
        const teamRef = collection(db, "team");
        const queryCompany = query(teamRef, where('fromCompany', '==', userCompany));
        const companySnapshot = await getDocs(queryCompany);
  
        const teams = companySnapshot.docs.map((companyDoc) => {
          const companyData = companyDoc.data();
          const members = companyData.members || [];
          const totalMembers = members.length;
  
          return { id: companyDoc.id, ...companyData, totalMembers };
        });
  
        const defaultOption = { id: '', teamName: 'Please select team' }; // Creating a default option
        const teamsWithDefault = [defaultOption, ...teams]; // Adding the default option to the teams array
        setJoinedTeams(teamsWithDefault); // Update the state variable with the default option
        console.log("AVAILABLE", teamsWithDefault);
      } else {
        console.log("User snapshot does not exist.");
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    }
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
        console.error('Incomplete task details. Please fill in all fields.');
        return;
      }
  
      const tasksCollection = collection(db, 'tasks');
  
      await addDoc(tasksCollection, {
        team: selectedTeam,
        taskName: taskName,
        date: taskDate,
        assignedUser: selectedUserEmail,
        description: taskDescription,
      });
  
      console.log('Task added successfully!');
      closeModal();
    } catch (error) {
      console.error('Error adding task:', error);
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

  console.log(generateDate());
 
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };



  return(
  <div className="flex dark:bg-gray-950 bg-white">           
    <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar}/>
    <div className='flex flex-col flex-1 w-full"'> 
      <header className='justify-content z-10 mt-5 bg-white shadow-md dark:bg-gray-950'>
        <div className="flex md:justify-center flex-1 lg:mr-32">
              <div className=" relative w-40 justify-center md:w-full max-w-xl mr-6 focus-within:text-purple-500">
              <div>
              <select
                className="w-full pl-8 pr-2 text-large dark:text-black ..."
                aria-label="Choose Team"
                value={selectedTeam}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const team = joinedTeams.find((team) => team.id === selectedId);
                  setSelectedTeam(team ? team.id : ''); // Set the selected team ID
                  fetchUsers(currentUser, team ? team.id : ''); // Fetch users for the selected team
                }}
                id="team-select"
              >
              {joinedTeams && joinedTeams.length > 0 ? (
                joinedTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.teamName}
                  </option>
                ))
              ) : (
                <div>
                  No teams available or you're not part of any teams.
                </div>
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
        {/* <div className="mt-5 flex gap-10 sm:divide-x justify-center sm:w-1/2 mx-auto h-screen items-center sm:flex-row flex-col"> */}
        <div className="mt-5 ml-10 flex sm:flex-row flex-col sm:divide-x w-full justify-center h-screen gap-10">
          <div className="w-96 h-96">
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
          </div>
          <div className=" w-96 h-96">
            <div className="flex justify-between items-center">
              <h1 className="select-none font-semibold">
                {months[today.month()]}, {today.year()}
              </h1>
              <div className="flex gap-10 items-center ">
                <GrFormPrevious
                  className="w-5 h-5 cursor-pointer hover:scale-105 transition-all"
                  onClick={() => {
                    setToday(today.month(today.month() - 1));
                  }}
                />
                <h1
                  className=" cursor-pointer hover:scale-105 transition-all"
                  onClick={() => {
                    setToday(currentDate);
                  }}
                >
                  Today
                </h1>
                <GrFormNext
                  className="w-5 h-5 cursor-pointer hover:scale-105 transition-all"
                  onClick={() => {
                    setToday(today.month(today.month() + 1));
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-7 ">
              {days.map((day, index) => {
                return (
                  <h1
                    key={index}
                    className="text-sm text-center h-14 w-14 grid place-content-center text-gray-500 select-none"
                  >
                    {day}
                  </h1>
                );
              })}
            </div>

            <div className=" grid grid-cols-7">
              {generateDate(today.month(), today.year()).map(({ date, currentMonth, today }, index) => {
                const dateHasTasks = hasTasksForDate(date);
                
                return (
                  <div
                    key={index}
                    className="p-2 text-center h-14 grid place-content-center text-sm border-t"
                  >
                    <h1
                      className={cn(
                        currentMonth ? "" : "text-gray-400",
                        today ? "bg-red-600 text-white" : "",
                        selectDate.toDate().toDateString() === date.toDate().toDateString()
                          ? "bg-black text-white"
                          : "",
                        dateHasTasks ? "bg-gray-300" : "",
                        "h-10 w-10 rounded-full grid place-content-center hover:bg-black hover:text-white transition-all cursor-pointer select-none"
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
          <div className="h-96 w-96 sm:px-5">
          <h1 className="font-semibold">
            Tasks for {selectDate.toDate().toDateString()}
          </h1>
          {tasksForSelectedDate.length > 0 ? (
            tasksForSelectedDate.map((task, index) => (
              <div key={index} className="border rounded p-2 mb-4">
                <h3 className="font-semibold">{task.taskName}</h3>
                <p>Description: {task.description}</p>
              </div>
            ))
          ) : (
            <p>No tasks for this date.</p>
          )}
          </div>
        </div>

        {isModalOpen && (
          <div id="modal" className="fixed top-0 left-0 w-full h-full bg-opacity-80 bg-gray-900 flex justify-center items-center">
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
                    <select name='users' id='users' value={selectedUserEmail} onChange={handleUserChange} className="block w-full px-4 py-2 border rounded-lg mt-1">
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


