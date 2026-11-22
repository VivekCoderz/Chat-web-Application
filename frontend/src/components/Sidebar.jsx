import { useState, useEffect } from "react";
import {
  MessageCircle,
  Settings,
  LogOut,
  ChevronDown,
  X,
  Plus,
  Hash,
  Users,
  Store,
  Play,
  Film,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import api from "../config";
import { logoutFail, logoutRequest, logoutSuccess } from "../Redux/feature/authSlice";
import { setActiveChat, clearMessages } from "../Redux/feature/generalChatSlice";
import { socket } from "../socket/socket";
import UsersModal from "./UsersModal";
import CreateGroupModal from "./CreateGroupModal";
import SettingsModal from "./SettingsModal";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ isOpen, onClose, isMobileInline }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((store) => store.authReducer.user);
  const activeChat = useSelector((store) => store.generalCharReducer.activeChat);
  const privateChatList = useSelector((store) => store.generalCharReducer.privateChatList);
  const groupList = useSelector((store) => store.generalCharReducer.groupList);
  const onlineUsers = useSelector((store) => store.onlineUsers.users);

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const handleLogout = async (e) => {
    dispatch(logoutRequest());
    try {
      await api.post("/auth/logout");
      socket.disconnect();
      dispatch(logoutSuccess());
    } catch (err) {
      dispatch(logoutFail(err.response?.data?.message || "Something went wrong"));
    }
  };

  const handleSelectGeneral = () => {
    dispatch(setActiveChat({ type: "general" }));
    socket.emit("getGeneralMessages");
    onClose();
  };

  const handleSelectPrivate = (partner) => {
    dispatch(setActiveChat({ type: "private", user: partner }));
    socket.emit("getPrivateMessages", { targetUserId: partner._id });
    socket.emit("markAsSeen", { chatType: "private", senderId: partner._id });
    onClose();
  };

  const handleSelectGroup = (group) => {
    dispatch(setActiveChat({ type: "group", group }));
    socket.emit("getGroupMessages", { groupId: group._id });
    socket.emit("markAsSeen", { chatType: "group", groupId: group._id });
    onClose();
  };

  const handleSelectShop = () => {
    dispatch(setActiveChat({ type: "shop_dashboard" }));
    onClose();
  };

  const handleSelectReels = () => {
    dispatch(setActiveChat({ type: "reels" }));
    onClose();
  };

  return (
    <>
      <aside
        className={`
          ${isMobileInline
            ? "flex h-full w-full flex-col bg-[#f7f7fc] dark:bg-[#0c0d14]"
            : `fixed inset-y-0 left-0 z-45 flex w-80 flex-col border-r border-gray-200 bg-[#f7f7fc] dark:border-slate-800/80 dark:bg-[#0c0d14] transform transition-transform duration-300 ease-in-out md:static md:z-auto md:translate-x-0 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              }`
          }
          transition-colors duration-200
        `}
      >
        {/* ================= LOGO ================= */}
        <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-gray-200 px-5 dark:border-slate-800/60 bg-[#f7f7fc] dark:bg-[#0c0d14]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-650 text-white shadow-xs">
            <MessageCircle size={19} />
          </div>

          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900 dark:text-white">ChatApp</h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 hidden dark:block">Connect & Chat</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-gray-305 md:hidden"
          >
            <X size={19} />
          </button>
        </div>



        {/* ================= NAVIGATION ================= */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          
          {/* 1. PUBLIC CHAT SECTION */}
          <div>
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              <span className="dark:hidden">CHANNELS</span>
              <span className="hidden dark:block">MENU</span>
            </p>
            <button
              onClick={handleSelectGeneral}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                activeChat.type === "general"
                  ? "bg-[#eef2fe] text-[#4f46e5] font-semibold dark:bg-[#1a153a]/75 dark:text-violet-400"
                  : "text-gray-600 hover:bg-gray-100/50 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                activeChat.type === "general" 
                  ? "bg-violet-100/80 text-violet-700 dark:bg-[#251e4d] dark:text-violet-400" 
                  : "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                <span className="dark:hidden"><Hash size={17} /></span>
                <span className="hidden dark:block"><MessageCircle size={17} /></span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">General Chat</p>
                <p className="truncate text-[10px] text-gray-400 dark:text-gray-500 hidden dark:block">
                  Public conversation
                </p>
              </div>
              {/* Light Mode Count Badge */}
              <span className="rounded-md bg-gray-200/60 px-2 py-0.5 text-xs text-gray-500 font-bold dark:hidden">
                {onlineUsers.length}
              </span>
              {/* Dark Mode Hash + Online Dot */}
              <div className="hidden dark:flex items-center gap-2">
                <Hash size={14} className="text-violet-400" />
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#10b981]" />
              </div>
            </button>
          </div>

          <hr className="border-gray-200/50 dark:border-slate-800/25 my-1" />

          {/* 2. PRIVATE CHAT SECTION */}
          <div>
            <div className="mb-2 px-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Private Chat
              </span>
              <button
                onClick={() => setIsUsersModalOpen(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-violet-650 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition"
              >
                Talk +
              </button>
            </div>

            <div className="space-y-1">
              {privateChatList.length === 0 ? (
                <p className="px-2 text-xs text-gray-400 dark:text-gray-500 py-1">No active direct messages</p>
              ) : (
                privateChatList.map((partner) => {
                  const isOnline = onlineUsers.some((u) => u.userId === partner._id);
                  const isActive = activeChat.type === "private" && activeChat.user?._id === partner._id;

                  return (
                    <button
                      key={partner._id}
                      onClick={() => handleSelectPrivate(partner)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                        isActive
                          ? "bg-[#eef2fe] text-[#4f46e5] font-semibold dark:bg-[#1a153a]/75 dark:text-violet-400"
                          : "text-gray-600 hover:bg-gray-100/50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100/60 dark:bg-violet-900/40 text-xs font-semibold text-violet-600 dark:text-violet-400 overflow-hidden border border-gray-200/20 dark:border-slate-800/30">
                          {partner.avatar ? (
                            <img src={partner.avatar} alt={partner.name} className="h-full w-full object-cover" />
                          ) : (
                            partner.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white dark:border-slate-900 bg-emerald-500 animate-pulse" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{partner.name}</p>
                        <p className={`truncate text-[10px] ${
                          isActive ? "text-violet-500 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"
                        }`}>
                          {isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <hr className="border-gray-200/50 dark:border-slate-800/25 my-1" />

          {/* 3. GROUP CHAT SECTION */}
          <div>
            <div className="mb-2 px-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Group Chat
              </span>
              <button
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-gray-300 transition"
                title="Create Group"
              >
                <Plus size={15} />
              </button>
            </div>

            <div className="space-y-1">
              {groupList.length === 0 ? (
                <p className="px-2 text-xs text-gray-400 dark:text-gray-500 py-1">No group chats joined</p>
              ) : (
                groupList.map((group) => {
                  const isActive = activeChat.type === "group" && activeChat.group?._id === group._id;

                  return (
                    <button
                      key={group._id}
                      onClick={() => handleSelectGroup(group)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                        isActive
                          ? "bg-[#eef2fe] text-[#4f46e5] font-semibold dark:bg-[#1a153a]/75 dark:text-violet-400"
                          : "text-gray-600 hover:bg-gray-100/50 dark:text-slate-300 dark:hover:bg-slate-800/55"
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                        isActive 
                          ? "bg-violet-100/80 text-violet-700 dark:bg-[#251e4d] dark:text-violet-400" 
                          : "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        <Users size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{group.name}</p>
                        <p className={`truncate text-[10px] ${
                          isActive ? "text-violet-500 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"
                        }`}>
                          {group.members?.length || 0} members
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <hr className="border-gray-200/50 dark:border-slate-800/25 my-1" />

          {/* 4. SHOP & REELS SECTIONS */}
          <div>
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              Discover
            </p>
            <div className="space-y-1">
              {/* Shop Dashboard */}
              <button
                onClick={handleSelectShop}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  activeChat.type === "shop_dashboard"
                    ? "bg-[#eef2fe] text-[#4f46e5] font-semibold dark:bg-[#1a153a]/75 dark:text-violet-400"
                    : "text-gray-600 hover:bg-gray-100/50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                  activeChat.type === "shop_dashboard" 
                    ? "bg-violet-100/80 text-violet-700 dark:bg-[#251e4d] dark:text-violet-400" 
                    : "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  <Store size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Shop Dashboard</p>
                  <p className={`truncate text-[10px] ${
                    activeChat.type === "shop_dashboard" ? "text-violet-500 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"
                  }`}>
                    Catalog & Orders
                  </p>
                </div>
              </button>

              {/* NexaReels */}
              <button
                onClick={handleSelectReels}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  activeChat.type === "reels"
                    ? "bg-[#eef2fe] text-[#4f46e5] font-semibold dark:bg-[#1a153a]/75 dark:text-violet-400"
                    : "text-gray-600 hover:bg-gray-100/50 dark:text-slate-300 dark:hover:bg-slate-800/55"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                  activeChat.type === "reels" 
                    ? "bg-violet-100/80 text-violet-700 dark:bg-[#251e4d] dark:text-violet-400" 
                    : "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  <Film size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">NexaReels</p>
                  <p className={`truncate text-[10px] ${
                    activeChat.type === "reels" ? "text-violet-500" : "text-gray-500 dark:text-gray-500"
                  }`}>
                    Showcase & Buy
                  </p>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* ================= USER SECTION ================= */}
        <div className="shrink-0 border-t border-gray-200 p-3 dark:border-slate-800/60 transition-colors duration-200">
          {/* Light Theme Profile card */}
          <div className="dark:hidden p-3 rounded-2xl bg-white shadow-xs border border-gray-200/55 hover:shadow-sm transition-all duration-200">
            <div 
              onClick={() => navigate("/profile")}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 overflow-hidden shadow-inner">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-xs" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-800 group-hover:text-violet-700 transition">{user?.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="truncate text-[11px] text-emerald-600 font-bold">Online</span>
                  </div>
                </div>
              </div>

              <ChevronDown size={15} className="shrink-0 text-gray-400 group-hover:text-gray-600 transition" />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-50 hover:bg-violet-100/80 py-2 text-xs font-bold text-violet-700 transition border border-violet-100/50 shadow-xs"
              >
                <Settings size={14} />
                <span>Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="rounded-xl border border-red-100 bg-red-50 hover:bg-red-100/85 px-2.5 py-2 text-red-500 transition shadow-xs"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>

          {/* Dark Theme Profile card */}
          <div className="hidden dark:block p-3 rounded-2xl bg-[#131522]/85 border border-slate-805/40">
            <div 
              onClick={() => navigate("/profile")}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-900/40 text-xs font-semibold text-violet-400 overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#131522] bg-[#10b981]" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-200">{user?.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="truncate text-[10.5px] text-emerald-400 font-medium">Online</span>
                  </div>
                </div>
              </div>

              <ChevronDown size={15} className="shrink-0 text-slate-500" />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 py-2 text-xs font-bold text-slate-200 transition border border-slate-700/30"
              >
                <Settings size={13} />
                <span>Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="rounded-xl border border-red-900/30 bg-red-950/20 hover:bg-red-950/40 p-2 text-red-400 transition"
                title="Logout"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Modals */}
      <UsersModal isOpen={isUsersModalOpen} onClose={() => setIsUsersModalOpen(false)} />
      <CreateGroupModal isOpen={isCreateGroupModalOpen} onClose={() => setIsCreateGroupModalOpen(false)} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </>
  );
};

export default Sidebar;