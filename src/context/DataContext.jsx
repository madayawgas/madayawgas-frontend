// src/context/DataContext.jsx
import { createContext, useState } from "react";
import { initialTrucks } from "../data/MockData";

// 1. Create the Context Blueprint
export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // 2. Load the mock data into React State
  const [trucks, setTrucks] = useState(initialTrucks);

  // --- THE METHODS ---

  // CREATE
  const addTruck = (newTruck) => {
    // Adds a new truck to the end of the array, generating a random ID
    setTrucks((prev) => [...prev, { id: Date.now(), ...newTruck }]);
  };

  // UPDATE
  const updateTruck = (id, updatedData) => {
    // Maps through the array. If the ID matches, it overwrites the specific fields.
    setTrucks((prev) =>
      prev.map((truck) =>
        truck.id === id ? { ...truck, ...updatedData } : truck,
      ),
    );
  };

  // DELETE
  const deleteTruck = (id) => {
    // Filters the array to keep everything EXCEPT the one with the matching ID
    setTrucks((prev) => prev.filter((truck) => truck.id !== id));
  };

  // 3. Bundle it all together
  const value = {
    trucks,
    addTruck,
    updateTruck,
    deleteTruck,
  };

  // 4. Wrap the application
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
