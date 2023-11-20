import React, { useState, useEffect } from "react";
import { firestore as db } from "../components/firebase";
import { collection, getDocs} from 'firebase/firestore';

function FilterableSelect({ onTeamChange, selectedTeam }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [loading, setLoading] = useState(true);

  // Define handleInputChange
  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const optionsCollection = collection(db, 'company'); 
        const querySnapshot = await getDocs(optionsCollection);
        const optionData = ["Select Company:"]; // Fixed to initialize with default option
        querySnapshot.forEach((doc) => {
          optionData.push(doc.data().companyName);
        });

        setOptions(optionData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching options from Firestore:", error);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (options.length > 0) {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
      const newSelected = filtered.length > 0 ? filtered[0] : "";
      setSelectedOption(newSelected);
      onTeamChange(newSelected);
    }
  }, [searchTerm, options, onTeamChange]);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative">
      <input
        type="text"
        className="block w-full px-4 py-2 border rounded-lg"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleInputChange}
      />
      <select
        className="block w-full px-4 py-2 border rounded-lg mt-1"
        value={selectedOption}
        onChange={(e) => {
          console.log("Dropdown value changed:", e.target.value);
          setSelectedOption(e.target.value);
          onTeamChange(e.target.value);
        }}
      >
        {/* Map over the filteredOptions for rendering the dropdown */}
        {filteredOptions.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FilterableSelect;
