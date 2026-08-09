import {
  Hash,
  Search,
  Bell,
  MoreVertical,
  Users,
} from "lucide-react";
import { useSelector } from "react-redux";

const ChatHeader = () => {
    const users = useSelector(store=>store.onlineUsers.users)
    console.log(users)
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-gray-200 bg-white px-5">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Channel Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Hash size={21} />
        </div>

        {/* Channel Info */}
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900">
            General Chat
          </h1>

          <div className="mt-0.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs text-gray-400">
              Public conversation
            </span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Online Users */}
        <div className="mr-2 hidden items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 sm:flex">
          <Users size={16} className="text-gray-400" />

          <span className="text-xs font-medium text-gray-600">
            {users.length} online
          </span>
        </div>

        {/* Search */}
        <button
          className="rounded-xl p-2.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
          title="Search"
        >
          <Search size={19} />
        </button>

        {/* Notifications */}
        <button
          className="rounded-xl p-2.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
          title="Notifications"
        >
          <Bell size={19} />
        </button>

        {/* More */}
        <button
          className="rounded-xl p-2.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
          title="More"
        >
          <MoreVertical size={19} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;