import { createContext, useState } from "react";
import { initialTrucks, initialUsers } from "../data/MockData";

// 1. Create the Context
export const DataContext = createContext();

// 2. Create the Provider Component
export const DataProvider = ({ children }) => {
  // Load the raw data into React State
  const [trucks, setTrucks] = useState(initialTrucks);
  const [users, setUsers] = useState(initialUsers);

  // --- TRUCK METHODS ---
  const updateTruck = (truckId, updatedData) => {
    setTrucks((prevTrucks) =>
      prevTrucks.map((truck) =>
        truck.id === truckId ? { ...truck, ...updatedData } : truck,
      ),
    );
  };

  const addTruck = (newTruck) => {
    setTrucks((prevTrucks) => [...prevTrucks, { id: Date.now(), ...newTruck }]);
  };

  // --- USER METHODS ---
  const addUser = (newUser) => {
    setUsers((prevUsers) => [...prevUsers, { id: Date.now(), ...newUser }]);
  };

  const updateUser = (userId, updatedData) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, ...updatedData } : user,
      ),
    );
  };

  const deleteUser = (userId) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  // 3. Bundle everything up to give to the rest of the app
  const value = {
    trucks,
    updateTruck,
    addTruck,
    users,
    addUser,
    updateUser,
    deleteUser,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
