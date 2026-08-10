import { MessageSquare, Film, Store, Users, Settings, Sun, Moon, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const PrimarySidebar = ({
  activeNav,
  onTabChange,
  onSettingsClick,
  onProfileClick,
}) => {
  const currentUser = useSelector((store) => store.authReducer.user);
  const onlineUsers = useSelector((store) => store.onlineUsers.users);
  
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const isDarkNow = document.documentElement.classList.contains("dark");
    if (isDarkNow) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    // Dispatch custom event to notify all components
    window.dispatchEvent(new Event("themeChange"));
  };

  const activeChat = useSelector((store) => store.generalCharReducer.activeChat);

  const navItems = [
    { id: "chats", label: "Chats", icon: MessageSquare, badge: null },
    { id: "reels", label: "Spotlight", icon: Film, badge: null },
    { id: "shop", label: "Shop", icon: Store, badge: null },
    { id: "users", label: "Online", icon: Users, badge: onlineUsers.length || null },
  ];

  return (
    <>
      {/* ================================= */}
      {/* DESKTOP VERTICAL SIDEBAR */}
      {/* ================================= */}
      <aside className="hidden md:flex flex-col w-[72px] h-full justify-between items-center py-5 bg-[#f7f7fc] border-r border-gray-200 dark:bg-[#08090f] dark:border-slate-800/60 transition-all duration-200 shrink-0 select-none">
        
        {/* Top: Branding / Logo */}
        <div className="flex flex-col items-center gap-6">
          <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-650 text-white shadow-md shadow-violet-500/20">
            <Sparkles size={18} className="animate-pulse" />
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`group relative h-12 w-12 flex items-center justify-center rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-violet-100 text-violet-700 dark:bg-[#1b153a] dark:text-violet-400 font-semibold"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-850 dark:hover:text-slate-200"
                  }`}
                  title={item.label}
                >
                  {/* Left indicator pill */}
                  <span className={`absolute left-0 w-1 bg-violet-650 dark:bg-violet-500 rounded-r-md transition-all duration-200 origin-left ${
                    isActive ? "h-6 scale-y-100" : "h-0 scale-y-0 group-hover:h-4 group-hover:scale-y-100"
                  }`} />
                  
                  <Icon size={20} className={`transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-105"}`} />

                  {/* Badge count */}
                  {item.badge !== null && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white border border-[#f7f7fc] dark:border-[#08090f]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-4">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="h-10 w-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-850 dark:hover:text-slate-205 transition-colors duration-200"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={19} className="text-amber-505" /> : <Moon size={19} />}
          </button>

          {/* Settings */}
          <button
            onClick={onSettingsClick}
            className="h-10 w-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-850 dark:hover:text-slate-202 transition-colors duration-200"
            title="Settings"
          >
            <Settings size={19} />
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onProfileClick}
            className="h-10 w-10 rounded-full border-2 border-violet-500 bg-violet-100 dark:bg-violet-900/40 text-xs font-semibold text-violet-700 overflow-hidden shadow-xs hover:scale-105 transition-transform duration-200 relative"
          >
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              currentUser?.name?.charAt(0).toUpperCase()
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#f7f7fc] bg-emerald-500 dark:border-[#08090f]" />
          </button>
        </div>
      </aside>

      {/* ================================= */}
      {/* MOBILE HORIZONTAL BOTTOM BAR */}
      {/* ================================= */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t border-gray-200 dark:bg-[#0c0d14] dark:border-slate-800/60 items-center justify-around z-40 pb-safe shadow-lg transition-colors duration-200 select-none ${
        (activeChat.type === "general" || activeChat.type === "private" || activeChat.type === "group") ? "hidden" : "flex"
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition ${
                isActive
                  ? "text-violet-650 dark:text-violet-400 font-bold"
                  : "text-gray-400"
              }`}
            >
              <div className="relative">
                <Icon size={19} className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                {item.badge !== null && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white border border-white dark:border-[#0c0d14]">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-1 font-semibold tracking-wide">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 bg-violet-600 dark:bg-violet-400 rounded-full" />
              )}
            </button>
          );
        })}

        {/* Profile/Settings mobile tab option */}
        <button
          onClick={onProfileClick}
          className={`flex flex-col items-center justify-center flex-1 h-full relative`}
        >
          <div className="h-5 w-5 rounded-full border border-violet-500 bg-violet-100 dark:bg-violet-900/40 text-[9px] font-semibold text-violet-700 overflow-hidden relative">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              currentUser?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-[9px] mt-1 font-semibold tracking-wide">Profile</span>
        </button>
      </nav>
    </>
  );
};

export default PrimarySidebar;
