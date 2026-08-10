import { useEffect, useState } from "react";
import { X, Search, Users } from "lucide-react";
import { socket } from "../socket/socket";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    socket.emit("getAllUsers");

    const handleAllUsers = (allUsers) => {
      setUsers(allUsers);
      setLoading(false);
    };

    socket.on("allUsers", handleAllUsers);

    return () => {
      socket.off("allUsers", handleAllUsers);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUsers.length === 0) return;

    socket.emit("createGroup", {
      name: groupName.trim(),
      members: selectedUsers,
    });

    // Reset fields
    setGroupName("");
    setSelectedUsers([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <form
        onSubmit={handleCreateGroup}
        className="relative flex h-full max-h-[550px] w-full max-w-md flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={18} className="text-violet-600 dark:text-violet-400" />
            Create Group Chat
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Inputs */}
        <div className="p-4 space-y-3 shrink-0">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Group Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Project Discussion"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-violet-450 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Select Members ({selectedUsers.length} selected)
            </label>
            <div className="relative mt-1.5 flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 transition focus-within:border-violet-450 dark:border-slate-850 dark:bg-slate-950 dark:focus-within:border-violet-900 focus-within:bg-white">
              <Search size={15} className="text-gray-400 mr-2 shrink-0 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-slate-200 dark:placeholder:text-slate-650"
              />
            </div>
          </div>
        </div>

        {/* User Selection List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400 dark:text-slate-500">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-slate-450">No users found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((u) => {
                const isChecked = selectedUsers.includes(u._id);
                return (
                  <button
                    type="button"
                    key={u._id}
                    onClick={() => handleToggleUser(u._id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${
                      isChecked
                        ? "bg-violet-50/50 dark:bg-violet-950/20"
                        : "hover:bg-gray-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                        isChecked
                          ? "border-violet-650 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-650"
                          : "border-gray-300 bg-white dark:border-slate-800 dark:bg-slate-950"
                      }`}
                    >
                      {isChecked && (
                        <svg
                          className="h-2.5 w-2.5 fill-current"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      )}
                    </div>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/40 text-xs font-semibold text-violet-600 dark:text-violet-405">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                      ) : (
                        u.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-800 dark:text-slate-205">{u.name}</p>
                      <p className="truncate text-[10px] text-gray-400 dark:text-slate-500">{u.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-gray-50 dark:bg-slate-900/40 rounded-b-2xl flex gap-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!groupName.trim() || selectedUsers.length === 0}
            className="flex-1 rounded-xl bg-violet-600 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-650"
          >
            Create Group
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupModal;
