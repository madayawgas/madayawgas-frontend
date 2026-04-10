// src/data/truckMockData.js
import { allUsers } from "./userMockData";

export const trucks = [
  {
    truckId: 101,
    plateNumber: "ABC-1234",
    model: "Isuzu Elf 250",
    yearModel: 2020,
    currentOdometer: 85200,
    lastPMOdometer: 80000,
    status: "AVAILABLE",
    assignedDriverId: 3, // Andres Bonifacio
  },
  {
    truckId: 102,
    plateNumber: "XYZ-9876",
    model: "Mitsubishi Fuso Canter",
    yearModel: 2021,
    currentOdometer: 46150,
    lastPMOdometer: 40000,
    status: "AVAILABLE",
    assignedDriverId: 4, // Jose Rizal
  },
  {
    truckId: 103,
    plateNumber: "DEF-4567",
    model: "Hino 300 Series",
    yearModel: 2019,
    currentOdometer: 120500,
    lastPMOdometer: 120000, // Due for maintenance!
    status: "UNDER_MAINTENANCE",
    assignedDriverId: 5, // Apolinario Mabini
    activeRepair: "Replacing brake pads and rotors", // Added so you have something to show for down trucks
  },
  {
    truckId: 104,
    plateNumber: "LMN-4321",
    model: "Isuzu Elf 250",
    yearModel: 2022,
    currentOdometer: 25800,
    lastPMOdometer: 20000,
    status: "AVAILABLE",
    assignedDriverId: 6, // Emilio Aguinaldo
  },
  {
    truckId: 105,
    plateNumber: "PQR-6789",
    model: "Mitsubishi Fuso Canter",
    yearModel: 2018,
    currentOdometer: 185900,
    lastPMOdometer: 180000,
    status: "UNDER_MAINTENANCE",
    assignedDriverId: 7, // Antonio Luna
    activeRepair: "Engine overhaul and radiator flush",
  },
];

// Helper to join the driver data into the truck data for easy frontend use
export const getHydratedTrucks = () => {
  return trucks.map((truck) => {
    // Find the driver assigned to this truck
    const driver = allUsers.find(
      (user) => user.userId === truck.assignedDriverId,
    );

    // Return the truck info WITH the driver's name directly attached
    return {
      ...truck,
      driverName: driver ? driver.name : "Unassigned",
      driverLicense: driver ? driver.licenseNo : "N/A",
    };
  });
};

export const allHydratedTrucks = getHydratedTrucks();
