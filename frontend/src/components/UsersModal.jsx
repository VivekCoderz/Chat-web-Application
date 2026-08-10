import { useEffect, useState } from "react";
import { X, Search, MessageSquare } from "lucide-react";
import { socket } from "../socket/socket";
import { useDispatch } from "react-redux";
import { setActiveChat, addPrivateChat, clearMessages } from "../Redux/feature/generalChatSlice";

const UsersModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
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

  const handleStartChat = (user) => {
    dispatch(clearMessages());
    dispatch(setActiveChat({ type: "private", user }));
    dispatch(addPrivateChat(user));
    socket.emit("getPrivateMessages", { targetUserId: user._id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative flex h-full max-h-[500px] w-full max-w-md flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Start Direct Message</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 transition focus-within:border-violet-400 dark:border-slate-850 dark:bg-slate-950 dark:focus-within:border-violet-900 focus-within:bg-white">
            <Search size={16} className="text-gray-400 mr-2 shrink-0 dark:text-slate-550" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-slate-200 dark:placeholder:text-slate-650"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400 dark:text-slate-500">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-gray-505 dark:text-slate-400">No users found</p>
              <p className="text-xs text-gray-400 mt-1 dark:text-slate-500">Try another search term.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleStartChat(u)}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-violet-50/50 dark:hover:bg-slate-800/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/40 text-sm font-semibold text-violet-600 dark:text-violet-405">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                    ) : (
                      u.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-200">{u.name}</p>
                    <p className="truncate text-[11px] text-gray-400 dark:text-slate-500">{u.email}</p>
                  </div>
                  <div className="text-gray-400 hover:text-violet-650 dark:text-slate-500 dark:hover:text-violet-400 transition">
                    <MessageSquare size={16} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersModal;
