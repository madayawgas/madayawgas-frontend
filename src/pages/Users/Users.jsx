import { useState } from "react";
import UserModal from "../../components/users/UserModal";
import Button from "../../components/ui/Button";
import { useData } from "../../context/DataContext";

export default function Users() {
  const { addUser, updateUser, users } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleSaveUser = (userData) => {
    if (editingUser) {
      updateUser(editingUser.userId, userData);
      console.log("Updated user:", userData);
    } else {
      addUser(userData);
      console.log("Added new user:", userData);
    }
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditClick = () => {
    // For testing, pick the first user from context if available
    if (users.length > 0) {
      const firstUser = users[0];
      // We need to map the context user data (which might have 'name') 
      // to the modal's expected 'firstName' and 'lastName' if necessary.
      // Assuming mock data might just have 'name', we split it for the test.
      const [firstName, ...lastNameParts] = (firstUser.name || "Test User").split(" ");
      
      setEditingUser({
        ...firstUser,
        firstName: firstUser.firstName || firstName,
        lastName: firstUser.lastName || lastNameParts.join(" "),
        contactNumber: firstUser.contactNumber || "09123456789",
        role: firstUser.role || "Admin"
      });
    } else {
      setEditingUser({
        userId: 999,
        firstName: "John",
        lastName: "Doe",
        contactNumber: "09123456789",
        role: "Manager",
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1B4B75]">Users Management</h1>
        <div className="flex gap-4">
          <Button onClick={handleAddClick}>
            ADD USER (TEST)
          </Button>

          <Button variant="secondary" onClick={handleEditClick}>
            EDIT USER (TEST)
          </Button>
        </div>
      </div>

      <p className="text-gray-600 mb-4">
        Total Users in Context: <span className="font-bold">{users.length}</span>
      </p>
      
      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveUser} 
        user={editingUser}
      />
    </div>
  );
}
