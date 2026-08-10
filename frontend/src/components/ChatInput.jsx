import { useRef, useState, useEffect } from "react";
import { Smile, Paperclip, Send, X, CornerDownRight } from "lucide-react";
import { socket } from "../socket/socket.js";
import { useSelector } from "react-redux";

const ChatInput = ({ reply, onCancelReply }) => {
  const [message, setMessage] = useState("");
  const activeChat = useSelector((store) => store.generalCharReducer.activeChat);
  const timeOut = useRef(null);

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  // Clear input when switching chats
  useEffect(() => {
    setMessage("");
    if (onCancelReply) onCancelReply();
  }, [activeChat]);

  const handleChange = (e) => {
    setMessage(e.target.value);

    // Emit typing status depending on active chat type
    if (activeChat.type === "general") {
      socket.emit("typing");
    } else if (activeChat.type === "private") {
      socket.emit("privateTyping", { receiverId: activeChat.user?._id });
    } else if (activeChat.type === "group") {
      socket.emit("groupTyping", { groupId: activeChat.group?._id });
    }

    clearTimeout(timeOut.current);

    timeOut.current = setTimeout(() => {
      if (activeChat.type === "general") {
        socket.emit("stopTyping");
      } else if (activeChat.type === "private") {
        socket.emit("privateStopTyping", { receiverId: activeChat.user?._id });
      } else if (activeChat.type === "group") {
        socket.emit("groupStopTyping", { groupId: activeChat.group?._id });
      }
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    // Build replyTo object if replying
    const replyTo = reply
      ? {
          messageId: reply._id,
          text: reply.message,
          senderName: reply.sender?.name,
        }
      : undefined;

    if (activeChat.type === "general") {
      socket.emit("sendGeneralMessage", { message: message.trim(), replyTo });
    } else if (activeChat.type === "private") {
      socket.emit("sendPrivateMessage", {
        receiverId: activeChat.user?._id,
        message: message.trim(),
        replyTo,
      });
    } else if (activeChat.type === "group") {
      socket.emit("sendGroupMessage", {
        groupId: activeChat.group?._id,
        message: message.trim(),
        replyTo,
      });
    }

    // Stop typing immediately on send
    if (activeChat.type === "general") {
      socket.emit("stopTyping");
    } else if (activeChat.type === "private") {
      socket.emit("privateStopTyping", { receiverId: activeChat.user?._id });
    } else if (activeChat.type === "group") {
      socket.emit("groupStopTyping", { groupId: activeChat.group?._id });
    }

    setMessage("");
    if (onCancelReply) onCancelReply();
  };

  const placeholderText = isDark
    ? (activeChat.type === "private" ? `Message @${activeChat.user?.name}...` : activeChat.type === "group" ? `Message group "${activeChat.group?.name}"...` : "Message General Chat...")
    : "Type a message...";

  return (
    <div className="border-t border-gray-200 bg-white p-4 dark:border-slate-800/60 dark:bg-[#0b0c14] transition-colors duration-200">
      
      {/* Reply Preview Banner */}
      {reply && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-violet-50/75 dark:bg-violet-950/20 px-3 py-2 border border-violet-100 dark:border-violet-900/40 text-xs text-violet-750 dark:text-violet-300">
          <div className="flex items-center gap-1.5 min-w-0">
            <CornerDownRight size={13} className="shrink-0 text-violet-500" />
            <div className="min-w-0">
              <span className="font-bold">Replying to {reply.sender?.name}:</span>{" "}
              <span className="truncate block mt-0.5 max-w-[200px] text-gray-500 dark:text-slate-400">
                {reply.message}
              </span>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="rounded-full p-1 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-500 dark:text-violet-400 shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Dynamic Form Input layout */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-[#1a1c28] px-3 py-1.5 shadow-xs transition focus-within:border-violet-305 focus-within:shadow-sm dark:focus-within:border-violet-900"
      >
        {/* EMOJI (Light Mode Left) */}
        {!isDark && (
          <button
            type="button"
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition shrink-0"
            title="Add Emoji"
          >
            <Smile size={19} />
          </button>
        )}

        {/* ATTACHMENT */}
        <button
          type="button"
          className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-[#25283a] hover:text-gray-600 dark:hover:text-slate-300 transition shrink-0"
          title="Attach File"
        >
          <Paperclip size={19} />
        </button>

        {/* INPUT FIELD */}
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder={placeholderText}
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-gray-700 dark:text-slate-100 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-600"
        />

        {/* EMOJI (Dark Mode Right) */}
        {isDark && (
          <button
            type="button"
            className="rounded-xl p-2 text-gray-400 hover:bg-[#25283a] hover:text-slate-205 transition shrink-0"
            title="Add Emoji"
          >
            <Smile size={19} />
          </button>
        )}

        {/* GIF BUTTON (Light Mode Right) */}
        {!isDark && (
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition shrink-0 uppercase tracking-wider"
          >
            GIF
          </button>
        )}

        {/* SEND BUTTON */}
        <button
          type="submit"
          disabled={!message.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-200 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 shrink-0 shadow-xs"
        >
          <Send size={15} />
        </button>
      </form>

      <p className="mt-2 text-center text-[10px] text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wider">
        Press Enter to send
      </p>
    </div>
  );
};

export default ChatInput;