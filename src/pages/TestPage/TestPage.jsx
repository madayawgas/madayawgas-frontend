import React, { useState } from 'react';
// This path goes up two folders (to src), then down into components/users
import PermissionsModal from '../../components/users/PermissionsModal';

export default function TestPage() {
  // State to control the modal visibility
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-[#104e7a] mb-6">Test Page</h1>
      
      {/* Trigger Button */}
      <button 
        onClick={() => setIsRoleModalOpen(true)}
        className="bg-[#127ebc] text-white px-5 py-2.5 rounded font-semibold text-sm hover:bg-[#0f6b9e] transition-colors shadow-sm"
      >
        ROLE & PERMISSIONS (TEST)
      </button>

      {/* The Modal Component */}
      <PermissionsModal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
      />
    </div>
  );
}