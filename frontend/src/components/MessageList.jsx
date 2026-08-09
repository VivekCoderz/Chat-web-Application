import { useSelector } from "react-redux";
import Message from "./Message";

const MessageList = () => {
  const messages = useSelector(
    (store) => store.generalCharReducer.messages
  );

  const currentUser = useSelector(
    (store) => store.authReducer.user?._id
  );

  const typingUsers = useSelector(
    (store) => store.onlineUsers.typingUsers
  );

  console.log(typingUsers)

  return (
    <div className="flex flex-1 flex-col justify-end overflow-y-auto py-4">

      {/* Messages */}
      {messages.map((message) => (
        <Message
          key={message._id}
          message={message}
          isOwnMessage={message.sender._id === currentUser}
        />
      ))}

      {/* Typing Users */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-2">

          {/* Avatars */}
          <div className="flex -space-x-2">
            {typingUsers.map((user) => (
              <div
                key={user.userId}
                className="h-7 w-7 overflow-hidden rounded-full border-2 border-white"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-violet-100 text-xs font-semibold text-violet-600">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Names */}
          <div className="text-sm text-gray-400">
            {typingUsers.map((user) => user.name).join(", ")}
            {typingUsers.length === 1 ? " is" : " are"} typing...
          </div>

        </div>
      )}
    </div>
  );
};

export default MessageList;