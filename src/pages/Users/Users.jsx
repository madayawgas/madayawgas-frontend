import { useState } from "react";
import UserModal from "../../components/users/UserModal";
import Button from "../../components/ui/Button";

export default function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveUser = (userData) => {
    console.log("Saving user:", userData);
    // Here you would typically call an API or update your state/context
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Users Page</h1>
      
      <Button onClick={() => setIsModalOpen(true)}>
        ADD USER (TEST)
      </Button>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveUser} 
      />
    </div>
  );
}
