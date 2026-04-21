import { useState } from "react";
import SearchBar from "../../components/ui/SearchBar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import { useData } from "../../context/DataContext";
import { Trash, Edit, Funnel, Plus, Settings } from "lucide-react";

export default function Users() {
    
    const [filterRole, setFilterRole] = useState("all");
    const { users, deleteUser } = useData();
    const filteredUsers = filterRole === "all" ? users : users.filter(user => user.role === filterRole);

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
                    <Button variant="primary">
                        <Plus size={18} />
                        Add New User
                    </Button>
                </div>
            </div>

            {/* <hr className="my-6 border-t-2 border-gray-200" /> */}

            <div className="header  flex md:flex-row md:items-end justify-between pb-4 mb-6">
                <div className="search-bar">
                    <SearchBar placeholder="Search users..."
                        className="md:w-100" />
                </div>

                {/* <div>
                    <Select>
                        <Funnel size={15} />
                        <span>Filter Roles</span>
                    </Select>
                </div> */}

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
                            { value: "user", label: "User" },
                        ]}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="user-table overflow-hidden border border-gray-400 rounded rounded-md">
                <table className="min-w-full  shadow-sm">
                    <thead className="min-w-full border border-gray-200 bg-[#DCE5EC] border-b-2">
                        <tr>
                            <th className="first-name text-[#1B4B75] py-2 font-semibold">First Name</th>
                            <th className="last-name text-[#1B4B75] py-2 font-semibold">Last Name</th>
                            <th className="contact-number text-[#1B4B75] py-2 font-semibold">Contact Number</th>
                            <th className="role text-[#1B4B75] py-2 font-semibold">Role</th>
                            <th className="date-created text-[#1B4B75] py-2 font-semibold">Date Created</th>
                            <th className="actions text-[#1B4B75] py-2 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="min-w-full">
                        {filteredUsers.map((user) => (
                        <tr key={user.userId} className="border border-gray-200 hover:bg-gray-50 transition-colors">
                            <td className="first-name p-2 text-center">{user.name}</td>
                            <td className="last-name p-2 text-center">{user.lastName}</td>
                            <td className="contact-number p-2 text-center">{user.contactNumber}</td>
                            <td className="role p-2 text-center">{user.role}</td>
                            <td className="date-created p-2 text-center">{user.dateCreated}</td>
                            <td class="px-6 py-4 items-center flex justify-center">
                                <div class="flex items-center gap-4">
                                    {/* Edit Icon Button */}
                                    <button className="text-slate-400 hover:text-blue-600 transition-colors">
                                        <Edit size={18} strokeWidth={2.5} />
                                    </button>

                                    {/* Trash Icon Button */}
                                    <button onClick={() => deleteUser(user.userId)} className="text-slate-400 hover:text-red-600 transition-colors">
                                        <Trash size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
