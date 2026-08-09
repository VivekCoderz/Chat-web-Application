import {
  Hash,
  Search,
  Bell,
  MoreVertical,
  Users,
  Menu,
} from "lucide-react";

import { useSelector } from "react-redux";

const ChatHeader = ({ onMenuClick, onUsersClick }) => {
  const users = useSelector(
    (store) => store.onlineUsers.users
  );

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 px-3 sm:px-5">

      {/* ================================= */}
      {/* LEFT SIDE */}
      {/* ================================= */}

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">

        {/* Mobile Menu */}
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 md:hidden"
        >
          <Menu size={21} />
        </button>

        {/* Channel Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Hash size={19} />
        </div>

        {/* Channel Info */}
        <div className="min-w-0">

          <h1 className="truncate text-[15px] font-semibold text-gray-900">
            General Chat
          </h1>

          <div className="mt-0.5 flex items-center gap-2">

            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

            <span className="truncate text-xs text-gray-400">
              Public conversation
            </span>

          </div>

        </div>

      </div>


      {/* ================================= */}
      {/* RIGHT SIDE */}
      {/* ================================= */}

      <div className="flex shrink-0 items-center gap-1">

        {/* =============================== */}
        {/* ONLINE USERS */}
        {/* =============================== */}

        <button
          onClick={onUsersClick}
          className="mr-1 flex items-center gap-2 rounded-xl bg-gray-50 px-2.5 py-2 transition hover:bg-gray-100 sm:mr-2 sm:px-3"
          title="Active Users"
        >

          <Users
            size={16}
            className="text-gray-400"
          />

          <span className="text-xs font-medium text-gray-600">
            {users.length}

            <span className="hidden sm:inline">
              {" "}
              online
            </span>
          </span>

        </button>


        {/* =============================== */}
        {/* SEARCH */}
        {/* =============================== */}

        <button
          className="rounded-xl p-2.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
          title="Search"
        >
          <Search size={19} />
        </button>


        {/* =============================== */}
        {/* NOTIFICATIONS */}
        {/* =============================== */}

        <button
          className="hidden rounded-xl p-2.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 sm:block"
          title="Notifications"
        >
          <Bell size={19} />
        </button>


        {/* =============================== */}
        {/* MORE */}
        {/* =============================== */}

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