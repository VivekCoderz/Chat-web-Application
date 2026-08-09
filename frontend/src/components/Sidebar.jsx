import {
  MessageCircle,
  Settings,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";

import { useSelector } from "react-redux";

const Sidebar = ({ isOpen, onClose }) => {
  const user = useSelector((store) => store.authReducer.user);

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        flex w-80 flex-col
        border-r border-gray-200 bg-white

        transform transition-transform duration-300 ease-in-out

        md:static
        md:z-auto
        md:translate-x-0

        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >

      {/* ================= LOGO ================= */}

      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-gray-200 px-5">

        {/* Logo */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
          <MessageCircle size={19} />
        </div>

        {/* App Name */}
        <div className="flex-1">
          <h1 className="text-sm font-bold text-gray-900">
            ChatApp
          </h1>

          <p className="text-[10px] text-gray-400">
            Connect & Chat
          </p>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 md:hidden"
        >
          <X size={19} />
        </button>

      </div>


      {/* ================= NAVIGATION ================= */}

      <div className="flex-1 overflow-y-auto px-3 py-5">

        {/* Chats title */}
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Chats
        </p>


        {/* General Chat */}
        <button
          onClick={onClose}
          className="flex w-full items-center gap-3 rounded-xl bg-violet-50 px-3 py-3 text-left text-violet-700"
        >

          {/* Chat Icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
            <MessageCircle size={17} />
          </div>


          {/* Chat Info */}
          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-semibold">
              General Chat
            </p>

            <p className="truncate text-[11px] text-violet-400">
              Public conversation
            </p>

          </div>


          {/* Online Indicator */}
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

        </button>

      </div>


      {/* ================= USER SECTION ================= */}

      <div className="shrink-0 border-t border-gray-200 p-3">

        {/* User */}
        <button className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-gray-50">

          {/* Avatar */}
          <div className="relative shrink-0">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            {/* Online dot */}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />

          </div>


          {/* User Info */}
          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-medium text-gray-800">
              {user?.name}
            </p>

            <p className="truncate text-[11px] text-gray-400">
              Online
            </p>

          </div>


          {/* Arrow */}
          <ChevronDown
            size={16}
            className="shrink-0 text-gray-400"
          />

        </button>


        {/* Bottom Actions */}
        <div className="mt-1 flex gap-1">

          {/* Settings */}
          <button
            className="
              flex flex-1 items-center justify-center gap-2
              rounded-lg p-2
              text-xs text-gray-400
              transition
              hover:bg-gray-50
              hover:text-gray-700
            "
          >
            <Settings size={15} />

            <span>
              Settings
            </span>
          </button>


          {/* Logout */}
          <button
            className="
              rounded-lg p-2
              text-gray-400
              transition
              hover:bg-red-50
              hover:text-red-500
            "
          >
            <LogOut size={15} />
          </button>

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;