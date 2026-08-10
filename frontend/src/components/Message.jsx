import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Reply, Smile, Trash2, Check, CheckCheck, Users } from "lucide-react";
import { socket } from "../socket/socket";
import { useSelector } from "react-redux";

const Message = ({ message, isOwnMessage, onReply }) => {
  const activeChat = useSelector((store) => store.generalCharReducer.activeChat);
  const currentUser = useSelector((store) => {
    const u = store.authReducer.user;
    return u?._id || u?.id;
  });
  const onlineUsers = useSelector((store) => store.onlineUsers.users);

  const [showOptions, setShowOptions] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const optionsRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleReact = (emoji) => {
    socket.emit("reactToMessage", {
      messageId: message._id,
      emoji,
      chatType: activeChat.type,
    });
    setShowReactionsMenu(false);
  };

  const handleDelete = (deleteType) => {
    socket.emit("deleteMessage", {
      messageId: message._id,
      chatType: activeChat.type,
      deleteType,
    });
    setShowOptions(false);
  };

  // Group reactions by emoji type
  const reactionGroups = message.reactions?.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {}) || {};

  // Check if sender is online
  const isSenderOnline = onlineUsers.some((u) => u.userId === (message.sender?._id || message.sender));

  // Check if it's a join/system message
  const isSystemMessage = message.message?.includes("joined the channel") || message.message?.includes("joined the group");

  if (isSystemMessage) {
    return (
      <div className="flex justify-start px-5 py-2.5">
        <div className="flex items-center gap-2 rounded-full bg-[#f0effc] dark:bg-[#1a153a] px-4 py-1.5 text-xs font-semibold text-[#5c4ec3] dark:text-violet-400 border border-violet-100/10 dark:border-violet-900/20 shadow-xs">
          <Users size={13} className="text-violet-600 dark:text-violet-400" />
          <span>{message.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex gap-3 px-5 py-2 transition-colors duration-150 ${
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 relative">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 dark:bg-[#16132b] text-sm font-semibold text-violet-650 dark:text-violet-400 overflow-hidden border border-gray-100 dark:border-slate-800/40">
          {message.sender?.avatar ? (
            <img src={message.sender.avatar} alt={message.sender.name} className="h-full w-full object-cover" />
          ) : (
            message.sender?.name?.charAt(0).toUpperCase()
          )}
        </div>
        {isSenderOnline && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#f7f7fc] dark:border-[#0b0c14] bg-emerald-500" />
        )}
      </div>

      {/* Message Content Container */}
      <div
        className={`flex max-w-[70%] flex-col relative ${
          isOwnMessage ? "items-end" : "items-start"
        }`}
      >
        {/* Name + Time */}
        <div
          className={`mb-1 flex items-center gap-2 ${
            isOwnMessage ? "flex-row-reverse" : ""
          }`}
        >
          <span className="text-xs font-bold text-violet-700 dark:text-slate-350">
            {message.sender?.name}
          </span>

          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
            {new Date(message.updatedAt || message.createdAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>

        {/* Reply Quoted Preview */}
        {message.replyTo && !message.isDeleted && (
          <div
            className={`mb-1 max-w-full rounded-lg px-3 py-1.5 text-xs border-l-4 truncate transition ${
              isOwnMessage
                ? "bg-[#eef2fe] text-violet-700 border-violet-300 dark:bg-violet-950/20 dark:text-violet-305 dark:border-violet-700"
                : "bg-gray-100 text-gray-600 border-gray-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-650"
            }`}
          >
            <p className="font-bold text-[9px] uppercase tracking-wider">
              Reply to {message.replyTo.senderName}
            </p>
            <p className="truncate mt-0.5">{message.replyTo.text}</p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`text-sm leading-relaxed relative break-words max-w-full transition-all px-4 py-2.5 rounded-2xl shadow-xs border ${
            message.isDeleted
              ? "bg-gray-100 border-gray-200 dark:border-slate-800 dark:bg-slate-800 text-gray-400 dark:text-slate-500 italic"
              : isOwnMessage
              ? "rounded-tr-none bg-[#e2e1f9] border-violet-200/20 text-gray-800 dark:bg-[#584cd2] dark:text-white dark:border-none"
              : "rounded-tl-none bg-[#f1f2f6] border-gray-200/40 text-gray-850 dark:bg-[#1c1d29] dark:text-slate-100 dark:border-none"
          }`}
        >
          {message.message}

          {/* Ticks (Read status) */}
          {isOwnMessage && activeChat.type === "private" && !message.isDeleted && (
            <span className="inline-flex align-bottom ml-1.5">
              {message.seen ? (
                <CheckCheck size={14} className="text-[#3b82f6] dark:text-sky-305" />
              ) : (
                <Check size={14} className="text-gray-450 dark:text-slate-450" />
              )}
            </span>
          )}
        </div>

        {/* Aggregated reactions list */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-full px-2 py-0.5 shadow-xs shrink-0 select-none ${
            isOwnMessage ? "self-end" : "self-start"
          }`}>
            {Object.entries(reactionGroups).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="flex items-center gap-0.5 text-xs hover:scale-105 active:scale-95 transition"
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Floating actions menu (Reactions + Reply + Trash dropdown) */}
        {!message.isDeleted && (
          <div
            className={`
              mt-1 hidden items-center gap-1.5
              group-hover:flex relative
              ${isOwnMessage ? "flex-row-reverse" : "flex-row"}
            `}
          >
            {/* Reactions Popover Trigger */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowReactionsMenu(true)}
                onMouseLeave={() => setShowReactionsMenu(false)}
                onClick={() => setShowReactionsMenu(!showReactionsMenu)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <Smile size={14} />
              </button>

              {/* Floating Emojis Popup */}
              {showReactionsMenu && (
                <div
                  onMouseEnter={() => setShowReactionsMenu(true)}
                  onMouseLeave={() => setShowReactionsMenu(false)}
                  className={`absolute bottom-full z-20 flex gap-1 rounded-full border border-gray-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-950 transition-all ${
                    isOwnMessage ? "right-0" : "left-0"
                  }`}
                >
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      className="hover:scale-125 transition text-base leading-none p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Button */}
            <button
              onClick={() => onReply(message)}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-200"
              title="Reply"
            >
              <Reply size={14} />
            </button>

            {/* Deletion / Options Dropdown */}
            <div className="relative" ref={optionsRef}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-205"
              >
                <MoreHorizontal size={14} />
              </button>

              {showOptions && (
                <div
                  className={`absolute bottom-full z-15 mb-1 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 ${
                    isOwnMessage ? "right-0" : "left-0"
                  }`}
                >
                  <button
                    onClick={() => handleDelete("for_me")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-600 hover:bg-gray-50 dark:text-slate-350 dark:hover:bg-slate-800/80"
                  >
                    <Trash2 size={13} className="text-gray-405" />
                    Delete for me
                  </button>
                  {isOwnMessage && (
                    <button
                      onClick={() => handleDelete("for_everyone")}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                    >
                      <Trash2 size={13} className="text-red-400" />
                      Delete for everyone
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
