import { MoreHorizontal, Reply } from "lucide-react";

const Message = ({ message, isOwnMessage }) => {
  return (
    <div
      className={`group flex gap-3 px-5 py-2 ${
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">
          {message.sender?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Message Content */}
      <div
        className={`flex max-w-[70%] flex-col ${
          isOwnMessage ? "items-end" : "items-start"
        }`}
      >
        {/* Name + Time */}
        <div
          className={`mb-1 flex items-center gap-2 ${
            isOwnMessage ? "flex-row-reverse" : ""
          }`}
        >
          <span className="text-sm font-semibold text-gray-800">
            {message.sender?.name}
          </span>

          <span className="text-[11px] text-gray-400">
            {new Date(message.updatedAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>

        {/* Message */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-6 ${
            isOwnMessage
              ? "rounded-tr-md bg-violet-600 text-white"
              : "rounded-tl-md bg-gray-100 text-gray-700"
          }`}
        >
          {message.message}
        </div>

        {/* Message Actions */}
        <div
          className={`
            mt-1 hidden items-center gap-1
            group-hover:flex
            ${isOwnMessage ? "flex-row-reverse" : ""}
          `}
        >
          <button className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <Reply size={14} />
          </button>

          <button className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Message;
