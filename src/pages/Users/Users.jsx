export default function Users() {

    return (
        <div className="user-management-page bg-white border rounded-md p-6">
            <div className="user-management-header">
                <h2 className="text-1xl md:text-[25px] font-bold text-[#1B4B75] mb-6">Users Management</h2>
                <p className="text-[#6D8AA2]">Manage user ......</p>
            </div>
            <div className="user-management-buttons flex gap-4">
                <button className="bg-[#0F7AB2] text-white px-4 py-2 rounded-lg hover:bg-[#0A4B6E] transition duration-300">Manage Roles & Permissions</button>
                <button className="bg-[#0F7AB2] text-white px-4 py-2 rounded-lg hover:bg-[#0A4B6E] transition duration-300">Add New User</button>
            </div>
            <hr className="my-6 border-t-2 border-gray-200" />
            <div className="search-bar">
                <input type="text" placeholder="Search users..." className="bg-[#DCE5EC] border border-gray-300 rounded-lg px-10 py-1.5" />
            </div>
            <div className="user-table">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr>
                            <th className="first-name">First Name</th>
                            <th className="last-name">Last Name</th>
                            <th className="role">Role</th>
                            <th className="date-created">Date Created</th>
                            <th className="actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="first-name">Alejandro</td>
                            <td className="last-name">Doe</td>
                            <td className="role">Admin</td>
                            <td className="date-created">2026-01-01</td>
                            <td className="actions">
                                <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300 mr-2">Edit</button>
                                <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}