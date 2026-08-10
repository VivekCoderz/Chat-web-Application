import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import Message from "./Message";

const MessageList = ({ onReply }) => {
  const messages = useSelector(
    (store) => store.generalCharReducer.messages
  );

  const currentUser = useSelector((store) => {
    const u = store.authReducer.user;
    return u?._id || u?.id;
  });

  const activeChat = useSelector(
    (store) => store.generalCharReducer.activeChat
  );

  const typingUsersRaw = useSelector(
    (store) => store.onlineUsers.typingUsers
  );

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter typing users based on the active chat channel
  const typingUsers = typingUsersRaw.filter((u) => {
    if (activeChat.type === "general") {
      return u.chatType === "general";
    } else if (activeChat.type === "private") {
      return u.chatType === "private" && u.userId === activeChat.user?._id;
    } else if (activeChat.type === "group") {
      return u.chatType === "group" && u.groupId === activeChat.group?._id;
    }
    return false;
  });

  return (
    <div className="flex flex-1 flex-col justify-end overflow-hidden bg-white dark:bg-[#0b0c14] transition-colors duration-200">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-5">
            <p className="text-sm font-medium text-gray-400 dark:text-slate-500">No messages yet</p>
            <p className="text-xs text-gray-305 dark:text-slate-600 mt-1">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const senderId = message.sender?._id || message.sender;
            const msgDate = new Date(message.createdAt).toDateString();
            const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
            const showDivider = msgDate !== prevMsgDate;
            
            let dividerText = "";
            if (showDivider) {
              const today = new Date().toDateString();
              const yesterday = new Date(Date.now() - 86400000).toDateString();
              if (msgDate === today) {
                dividerText = "Today";
              } else if (msgDate === yesterday) {
                dividerText = "Yesterday";
              } else {
                dividerText = new Date(message.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                });
              }
            }

            return (
              <div key={message._id}>
                {showDivider && (
                  <div className="flex justify-center my-4 px-5 relative">
                    <div className="absolute inset-0 flex items-center px-5" aria-hidden="true">
                      <div className="w-full border-t border-gray-200/70 dark:border-slate-800/30"></div>
                    </div>
                    <span className="relative rounded-full bg-[#f0effc] dark:bg-[#1a153a] px-4 py-1 text-[11px] font-bold text-violet-700 dark:text-violet-400 border border-violet-100/10 dark:border-violet-900/30">
                      {dividerText}
                    </span>
                  </div>
                )}
                <Message
                  message={message}
                  isOwnMessage={senderId === currentUser}
                  onReply={onReply}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Users Indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-2 shrink-0 bg-slate-50/20 dark:bg-slate-900/10 border-t border-gray-100/50 dark:border-slate-900/50">
          {/* Avatars */}
          <div className="flex -space-x-2">
            {typingUsers.map((user) => (
              <div
                key={user.userId}
                className="h-7 w-7 overflow-hidden rounded-full border-2 border-white dark:border-slate-950 shrink-0"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-violet-100 dark:bg-violet-900/40 text-xs font-semibold text-violet-600 dark:text-violet-400">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Names */}
          <div className="text-sm text-gray-400 dark:text-slate-500">
            {typingUsers.map((user) => user.name).join(", ")}
            {typingUsers.length === 1 ? " is" : " are"} typing...
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;