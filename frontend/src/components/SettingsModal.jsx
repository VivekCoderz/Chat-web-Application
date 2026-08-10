import { useEffect, useState } from "react";
import { X, Moon, Sun } from "lucide-react";

const SettingsModal = ({ isOpen, onClose }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
    window.dispatchEvent(new Event("themeChange"));
  }, [theme]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Theme Section */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
            Appearance
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Light Mode option */}
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                theme === "light"
                  ? "border-violet-600 bg-violet-50 text-violet-700 font-semibold dark:bg-violet-950/20 dark:border-violet-500 dark:text-violet-400"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <Sun size={20} />
              <span className="text-xs">Light</span>
            </button>

            {/* Dark Mode option */}
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                theme === "dark"
                  ? "border-violet-600 bg-violet-950/20 text-violet-400 font-semibold dark:border-violet-500 dark:text-violet-400"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <Moon size={20} />
              <span className="text-xs">Dark</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
