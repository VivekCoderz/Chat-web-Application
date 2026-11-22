import {
  Hash,
  Search,
  Bell,
  MoreVertical,
  Users,
  Menu,
  ShoppingBag,
  LogOut,
  ArrowLeft,
} from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { socket } from "../socket/socket";
import { setActiveChat, clearMessages } from "../Redux/feature/generalChatSlice";
import { useNavigate } from "react-router-dom";

const ChatHeader = ({ onMenuClick, onUsersClick, onShopClick, onCartClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activeChat = useSelector((store) => store.generalCharReducer.activeChat);
  const onlineUsers = useSelector((store) => store.onlineUsers.users);
  const [cartCount, setCartCount] = useState(0);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem("nexacart") || "[]");
      setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
    };
    updateCount();
    window.addEventListener("cartUpdate", updateCount);
    return () => window.removeEventListener("cartUpdate", updateCount);
  }, []);

  let icon, title, statusText, statusDotClass;

  if (activeChat.type === "general") {
    icon = <Hash size={19} />;
    title = "General Chat";
    statusText = "Public conversation";
    statusDotClass = "bg-emerald-500";
  } else if (activeChat.type === "private") {
    const isOnline = onlineUsers.some((u) => u.userId === activeChat.user?._id);
    icon = activeChat.user?.avatar ? (
      <img src={activeChat.user.avatar} alt={activeChat.user.name} className="h-full w-full object-cover" />
    ) : (
      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase">
        {activeChat.user?.name?.charAt(0)}
      </span>
    );
    title = activeChat.user?.name || "Direct Message";
    statusText = isOnline ? "Online" : "Offline";
    statusDotClass = isOnline ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600";
  } else if (activeChat.type === "group") {
    icon = <Users size={18} />;
    title = activeChat.group?.name || "Group Chat";
    statusText = `${activeChat.group?.members?.length || 0} members`;
    statusDotClass = "bg-violet-500";
  } else if (activeChat.type === "shop_dashboard") {
    icon = <ShoppingBag size={18} />;
    title = "Shop Dashboard";
    statusText = "E-commerce Control Panel";
    statusDotClass = "bg-violet-600";
  }

  const handleHeaderClick = () => {
    if (activeChat.type === "private" && activeChat.user?._id) {
      navigate(`/profile/${activeChat.user._id}`);
    } else if (activeChat.type === "group" && (activeChat.group?.creator?._id || activeChat.group?.creator)) {
      navigate(`/profile/${activeChat.group.creator._id || activeChat.group.creator}`);
    }
  };

  const handleLeaveGroup = () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      socket.emit("leaveGroup", { groupId: activeChat.group._id });
      dispatch(clearMessages());
      dispatch(setActiveChat({ type: "general" }));
      socket.emit("getGeneralMessages");
    }
  };

  return (
    <>
      <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 px-3 sm:px-5 bg-white dark:bg-[#0c0d14] dark:border-slate-800 transition-colors duration-200">
        {/* ================================= */}
        {/* LEFT SIDE */}
        {/* ================================= */}
        <div 
          onClick={handleHeaderClick}
          className={`flex min-w-0 items-center gap-2 sm:gap-3 flex-1 ${
            (activeChat.type === "private" || activeChat.type === "group") ? "cursor-pointer hover:opacity-80 transition" : ""
          }`}
        >
          {/* Mobile Back Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(setActiveChat({ type: "none" }));
            }}
            className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-205 md:hidden"
          >
            <ArrowLeft size={21} />
          </button>

          {/* Channel Icon (Hidden for general chat as per designs) */}
          {activeChat.type !== "general" && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-450 overflow-hidden">
              {icon}
            </div>
          )}

          {/* Channel Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {activeChat.type === "general" && (
                <span className="text-xl font-bold text-violet-600 dark:text-slate-400 font-mono">#</span>
              )}
              <h1 className="truncate text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h1>

              {/* Clickable Online Users badge */}
              {activeChat.type === "general" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUsersClick();
                  }}
                  className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/30 hover:opacity-80 active:scale-95 transition shadow-xs cursor-pointer shrink-0"
                  title="View Online Users List"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>{onlineUsers.length || 0} Online</span>
                </button>
              )}
            </div>

            <div className="mt-0.5 flex items-center gap-2">
              {activeChat.type === "general" ? (
                <>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-405">
                    <span>{statusText}</span>
                  </div>
                </>
              ) : (
                <>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass}`} />
                  <span className="truncate text-xs text-gray-400 dark:text-slate-500">
                    {statusText}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ================================= */}
        {/* RIGHT SIDE */}
        {/* ================================= */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* =============================== */}
          {/* SHOP CATALOG (Visible in private & group chats) */}
          {/* =============================== */}
          {(activeChat.type === "private" || activeChat.type === "group") && (
            <button
              onClick={onShopClick}
              className="mr-1 flex items-center gap-2 rounded-xl bg-violet-50 dark:bg-violet-900/40 px-2.5 py-2 text-violet-600 dark:text-violet-400 transition hover:bg-violet-100 dark:hover:bg-violet-900/60 sm:mr-2 sm:px-3"
              title="View Shop Catalog"
            >
              <ShoppingBag size={16} />
              <span className="text-xs font-semibold hidden sm:inline">Shop</span>
            </button>
          )}

          <button
            onClick={onCartClick}
            className="mr-1 flex items-center gap-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/20 px-2.5 py-2 text-pink-600 dark:text-pink-405 transition hover:bg-pink-100 dark:hover:bg-pink-900/40 sm:mr-2 sm:px-3 relative"
            title="Shopping Cart"
          >
            <ShoppingBag size={15} />
            <span className="text-xs font-semibold hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* =============================== */}
          {/* LEAVE GROUP (Only visible in group chats) */}
          {/* =============================== */}
          {activeChat.type === "group" && (
            <button
              onClick={handleLeaveGroup}
              className="mr-1 flex items-center gap-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 px-2.5 py-2 text-rose-600 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-900/40 sm:mr-2 sm:px-3"
              title="Leave Group"
            >
              <LogOut size={14} />
              <span className="text-xs font-semibold hidden sm:inline">Leave</span>
            </button>
          )}

          {/* =============================== */}
          {/* ONLINE USERS (Only visible in general / group - Hidden in light mode right bar as active users pane is open by default) */}
          {/* =============================== */}
          {activeChat.type === "general" && (
            <button
              onClick={onUsersClick}
              className="mr-1 rounded-xl bg-gray-50 dark:bg-slate-800 px-2.5 py-2 transition hover:bg-gray-100 dark:hover:bg-slate-700 sm:mr-2 sm:px-3 hidden sm:dark:flex"
              title="Active Users"
            >
              <Users size={16} className="text-gray-405 dark:text-slate-550" />
              <span className="text-xs font-medium text-gray-600 dark:text-slate-300">
                {onlineUsers.length}
                <span className="hidden sm:inline"> online</span>
              </span>
            </button>
          )}

          {/* =============================== */}
          {/* SEARCH */}
          {/* =============================== */}
          <button
            className="hidden sm:flex rounded-xl p-2.5 text-gray-550 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:bg-[#131522]/65 dark:hover:bg-[#1b1d2e] dark:border dark:border-slate-800/40"
            title="Search"
          >
            <Search size={18} />
          </button>

          {/* =============================== */}
          {/* NOTIFICATIONS */}
          {/* =============================== */}
          <button
            className="hidden sm:flex rounded-xl p-2.5 text-gray-550 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:bg-[#131522]/65 dark:hover:bg-[#1b1d2e] dark:border dark:border-slate-800/40 relative"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-violet-600" />
          </button>

          {/* =============================== */}
          {/* MORE */}
          {/* =============================== */}
          <button
            className="rounded-xl p-2.5 text-gray-550 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:bg-[#131522]/65 dark:hover:bg-[#1b1d2e] dark:border dark:border-slate-800/40"
            title="More"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

    </>
  );
};

export default ChatHeader;