import { useRef, useState } from "react";
import { Smile, Paperclip, Send } from "lucide-react";
import {socket} from "../socket/socket.js"

const ChatInput = () => {
  const [message, setMessage] = useState("");
  const timeOut = useRef(null);

  const handleChange = (e) => {
    setMessage(e.target.value)
    socket.emit('typing')
    clearTimeout(timeOut.current)

    timeOut.current = setTimeout(()=>{
        socket.emit("stopTyping")
    },2000)
  }


  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim()) return;
    
    socket.emit("sendGeneralMessage",{message : message.trim()})

    setMessage("");
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 transition focus-within:border-violet-300 focus-within:bg-white focus-within:shadow-sm"
      >
        {/* Attachment */}
        <button
          type="button"
          className="rounded-xl p-2 text-gray-400 transition hover:bg-violet-50 hover:text-violet-600"
        >
          <Paperclip size={19} />
        </button>

        {/* Input */}
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder="Message General Chat..."
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />

        {/* Emoji */}
        <button
          type="button"
          className="rounded-xl p-2 text-gray-400 transition hover:bg-violet-50 hover:text-violet-600"
        >
          <Smile size={19} />
        </button>

        {/* Send */}
        <button
          type="submit"
          disabled={!message.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-200"
        >
          <Send size={17} />
        </button>
      </form>

      <p className="mt-2 text-center text-[11px] text-gray-400">
        Press Enter to send
      </p>
    </div>
  );
};

export default ChatInput;