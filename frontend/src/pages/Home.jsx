import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";
import ActiveUsers from "../components/ActiveUsers";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import {
  addMessage,
  chatFail,
  chatRequest,
  chatSuccess,
} from "../Redux/feature/generalChatSlice";

import {
  addOnlineUser,
  addTypingUser,
  removeOnlineUser,
  removeTypingUser,
  setOnlineUsers,
} from "../Redux/feature/onlineUsersSlice.js";

import { socket } from "../socket/socket.js";

const Home = () => {
  const dispatch = useDispatch();

  // Mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mobile active users drawer
  const [isUsersOpen, setIsUsersOpen] = useState(false);

  useEffect(() => {
    dispatch(chatRequest());

    const handleMessages = (messages) => {
      console.log("✅ Messages received:", messages);
      dispatch(chatSuccess(messages));
    };

    const handleChatError = (error) => {
      console.error("❌ General chat error:", error);
      dispatch(chatFail(error));
    };

    const handleConnectError = (error) => {
      console.error("❌ Socket connection error:", error);
      dispatch(chatFail(error.message));
    };

    const handleNewMessage = (message) => {
      dispatch(addMessage(message));
    };

    // Get previous messages
    socket.emit("getGeneralMessages");

    // Messages
    socket.on("generalMessages", handleMessages);
    socket.on("generalChatError", handleChatError);
    socket.on("connect_error", handleConnectError);
    socket.on("newGeneralMessage", handleNewMessage);

    // Typing
    socket.on("userTyping", ({ userId, name, avatar }) => {
      dispatch(
        addTypingUser({
          userId,
          name,
          avatar,
        })
      );
    });

    socket.on("userStopTyping", ({ userId }) => {
      dispatch(removeTypingUser(userId));
    });

    // Online users
    socket.on("onlineUsers", (users) => {
      dispatch(setOnlineUsers(users));
    });

    socket.on("userOnline", (user) => {
      dispatch(addOnlineUser(user));
    });

    socket.on("userOffline", ({ userId }) => {
      dispatch(removeOnlineUser(userId));
    });

    // Cleanup
    return () => {
      socket.off("generalMessages", handleMessages);
      socket.off("generalChatError", handleChatError);
      socket.off("connect_error", handleConnectError);
      socket.off("newGeneralMessage", handleNewMessage);

      socket.off("userTyping");
      socket.off("userStopTyping");

      socket.off("onlineUsers");
      socket.off("userOnline");
      socket.off("userOffline");
    };
  }, [dispatch]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">

      {/* ================================= */}
      {/* MOBILE SIDEBAR OVERLAY */}
      {/* ================================= */}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ================================= */}
      {/* LEFT SIDEBAR */}
      {/* ================================= */}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* ================================= */}
      {/* MAIN CHAT */}
      {/* ================================= */}

      <main className="flex min-w-0 flex-1 flex-col bg-white">

        {/* Header */}
        <ChatHeader
          onMenuClick={() => setIsSidebarOpen(true)}
          onUsersClick={() => setIsUsersOpen(true)}
        />

        {/* Messages */}
        <MessageList />

        {/* Input */}
        <ChatInput />

      </main>

      {/* ================================= */}
      {/* ACTIVE USERS */}
      {/* ================================= */}

      <ActiveUsers
        isOpen={isUsersOpen}
        onClose={() => setIsUsersOpen(false)}
      />

    </div>
  );
};

export default Home;