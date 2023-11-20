import React from 'react';

function TeamSelector({ userTeams }) { 

  if (!userTeams.length) {
    return <div>No teams available or you're not part of any teams.</div>;
  }

  return (
    <div>
        <select
          className="w-full pl-8 pr-2 text-large dark:text-black text-black placeholder-blue-600 bg-gray-200 border-0 rounded-md dark:placeholder-gray-500 dark:focus:shadow-outline-blue dark:focus:placeholder-gray-600 
          dark:bg-gray-200 focus:placeholder-gray-500 focus:bg-white focus:border-red-300 focus:outline-none focus:shadow-outline-purple focus:text-blue-500 form-input"
          aria-label="Choose Team"
          defaultValue=""
          id="team-select"
        >
          {userTeams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
    </div>
  );
}


export default TeamSelector;
