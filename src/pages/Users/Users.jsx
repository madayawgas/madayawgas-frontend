import { useState, useMemo } from "react";
import SearchBar from "../../components/ui/SearchBar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import UserModal from "../../components/users/UserModal";
import { useData } from "../../context/DataContext";
import { Trash, Edit, Funnel, Plus, Settings } from "lucide-react";
import { createPortal } from "react-dom";

    const Modal = ({ title, children }) => {
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-[#1B4B75]">{title}</h3>
                    </div>
                    <div className="p-8">
                        {children}
                    </div>
                </div>
            </div>,
            document.body
        );
    };
export default function Users() {
    const { users, deleteUser } = useData();
    
    const [filterRole, setFilterRole] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'asc' });
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    const processedUsers = useMemo(() => {
        let result = [...users];

        // 1. Role Filter
        if (filterRole !== "all") {
            result = result.filter(user => 
                user.role.toLowerCase() === filterRole.toLowerCase()
            );
        }

        // 2. Search Filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(user => 
                user.firstName.toLowerCase().includes(lowerSearch) ||
                user.lastName.toLowerCase().includes(lowerSearch) ||
                user.contactNumber.includes(lowerSearch)
            );
        }

        // 3. Sorting Logic
        result.sort((a, b) => {
            const aValue = a[sortConfig.key]?.toString().toLowerCase() || "";
            const bValue = b[sortConfig.key]?.toString().toLowerCase() || "";
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [users, searchTerm, filterRole, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <Card>
            <div className="header  flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-4 mb-6">
                <div className="user-management-header">
                    <h2 className="text-1xl md:text-[25px] font-bold text-[#1B4B75] mb-1">Users Management</h2>
                    <p className="text-[#6D8AA2]">Manage user accounts and their permissions.</p>
                </div>

                <div className="user-management-buttons flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                    <Button variant="primary">
                        <Settings size={20} color="yellow" />
                        Manage Roles & Permissions
                    </Button>
                    <Button variant="primary"onClick={() => setIsAddingUser(true)}>
                        <Plus size={18} />
                        Add New User
                    </Button>
                </div>
            </div>

            <div className="header  flex md:flex-row md:items-end justify-between pb-4 mb-6">
                <div className="search-bar">
                    <SearchBar 
                        placeholder="Search users..."
                        className="md:w-100" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative w-48">
                    <Funnel size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
                    {!filterRole && (
                        <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none z-10">
                            Filter Roles
                        </span>
                    )}

                    <Select
                        id="role-filter"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        options={[
                            { value: "all", label: "All Roles" },
                            { value: "admin", label: "Admin" },
                            { value: "driver", label: "Driver" },
                            { value: "manager", label: "Manager" },
                        ]}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="user-table overflow-hidden border border-gray-400 rounded rounded-md">

                {/* Shared Modal for Adding and Editing */}
                <UserModal 
                    isOpen={isAddingUser || !!editingUser} 
                    onClose={() => {
                        setIsAddingUser(false);
                        setEditingUser(null);
                    }}
                    user={editingUser}
                />

                {userToDelete && (
                    <Modal title="Confirm Deletion" onClose={() => setUserToDelete(null)}>
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                    <Trash className="h-6 w-6 text-red-600" />
                                </div>
                                <p className="text-gray-600">
                                    Are you sure you want to delete <strong>{userToDelete.firstName} {userToDelete.lastName}</strong>? 
                                    This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex justify-center gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setUserToDelete(null)} 
                                    className="px-6 py-2 text-gray-500 font-semibold hover:text-gray-700 transition-colors uppercase text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        deleteUser(userToDelete.userId);
                                        setUserToDelete(null);
                                    }} 
                                    className="px-8 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-bold shadow-md uppercase text-sm"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}

                <table className="min-w-full  shadow-sm">
                    <thead className="min-w-full border border-gray-200 bg-[#DCE5EC] border-b-2">
                        <tr>
                            <th className="cursor-pointer text-[#1B4B75] py-2 font-semibold hover:bg-gray-200" onClick={() => handleSort('firstName')}>
                                First Name {sortConfig.key === 'firstName' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th className="cursor-pointer text-[#1B4B75] py-2 font-semibold hover:bg-gray-200" onClick={() => handleSort('lastName')}>
                                Last Name {sortConfig.key === 'lastName' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th className="text-[#1B4B75] py-2 font-semibold">Contact Number</th>
                            <th className="cursor-pointer text-[#1B4B75] py-2 font-semibold hover:bg-gray-200" onClick={() => handleSort('role')}>
                                Role {sortConfig.key === 'role' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th className="cursor-pointer text-[#1B4B75] py-2 font-semibold hover:bg-gray-200" onClick={() => handleSort('dateCreated')}>
                                Date Created {sortConfig.key === 'dateCreated' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th className="text-[#1B4B75] py-2 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="min-w-full">
                        {processedUsers.length > 0 ? (
                            processedUsers.map((user) => (
                                <tr key={user.userId} className="border border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="p-2 text-center">{user.firstName}</td>
                                    <td className="p-2 text-center">{user.lastName}</td>
                                    <td className="p-2 text-center">{user.contactNumber}</td>
                                    <td className="p-2 text-center">
                                        {/* Optional: Add a badge style for the role */}
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            user.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-2 text-center">{user.dateCreated}</td>
                                    <td className="px-6 py-4 flex justify-center gap-4">
                                        <button onClick={() => setEditingUser(user)} className="text-slate-400 hover:text-blue-600"><Edit size={18} /></button>
                                        <button onClick={() => setUserToDelete(user)} className="text-slate-400 hover:text-red-600"><Trash size={18} /></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-10 text-center text-gray-500 italic">
                                    No users match your search or filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}