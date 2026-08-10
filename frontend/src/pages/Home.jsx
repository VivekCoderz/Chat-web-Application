import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";
import ActiveUsers from "../components/ActiveUsers";
import ShopDashboard from "../components/ShopDashboard";
import StorefrontCatalog from "../components/StorefrontCatalog";
import ReelsSection from "../components/ReelsSection";
import ShoppingCart from "../components/ShoppingCart";
import PrimarySidebar from "../components/PrimarySidebar";
import UserProfileModal from "../components/UserProfileModal";
import SettingsModal from "../components/SettingsModal";
import { Pin, X, Sparkles } from "lucide-react";

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  addMessage,
  chatFail,
  chatRequest,
  chatSuccess,
  setPrivateChats,
  setGroups,
  addGroup,
  updateMessage,
  removeMessage,
  markMessagesAsSeen,
  setActiveChat,
} from "../Redux/feature/generalChatSlice";

import {
  addOnlineUser,
  addTypingUser,
  removeOnlineUser,
  removeTypingUser,
  setOnlineUsers,
} from "../Redux/feature/onlineUsersSlice.js";

import { socket } from "../socket/socket.js";

const ChatLandingPage = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/20 dark:bg-[#08090f]/10 transition-colors duration-200 select-none text-center h-full">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#0c0d14] border border-gray-200/70 dark:border-slate-800/40 shadow-xs flex flex-col items-center">
        
        {/* Glow Logo */}
        <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-650 text-white shadow-md shadow-violet-500/10 mb-5">
          <Sparkles size={24} className="animate-pulse" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Welcome to NexaChat
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 font-medium leading-relaxed max-w-sm">
          Connect with channels, message people instantly, browse e-commerce catalog storefronts, and watch trending short videos.
        </p>

        {/* Action cards info */}
        <div className="grid grid-cols-2 gap-3 mt-7 w-full text-left">
          <div className="p-3 bg-[#f7f7fc]/50 dark:bg-[#131522]/30 border border-gray-200/40 dark:border-slate-800/40 rounded-2xl">
            <span className="text-violet-600 dark:text-violet-400 font-bold text-xs block">💬 Conversations</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 block">Chat in channels, DMs, or group spaces.</span>
          </div>

          <div className="p-3 bg-[#f7f7fc]/50 dark:bg-[#131522]/30 border border-gray-200/40 dark:border-slate-800/40 rounded-2xl">
            <span className="text-pink-500 font-bold text-xs block">🛍️ Shop Dashboard</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 block">Browse catalogs, add items to cart, and order.</span>
          </div>

          <div className="p-3 bg-[#f7f7fc]/50 dark:bg-[#131522]/30 border border-gray-200/40 dark:border-slate-800/40 rounded-2xl">
            <span className="text-emerald-500 font-bold text-xs block">🎥 NexaSpotlight</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 block">Watch short clips, check analytics, and follow.</span>
          </div>

          <div className="p-3 bg-[#f7f7fc]/50 dark:bg-[#131522]/30 border border-gray-200/40 dark:border-slate-800/40 rounded-2xl">
            <span className="text-amber-500 font-bold text-xs block">🟢 Online Members</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 block">See active members online in real-time.</span>
          </div>
        </div>

        <p className="mt-7 text-[9px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest">
          🔐 End-to-End Encrypted
        </p>
      </div>
    </div>
  );
};

const Home = () => {
  const dispatch = useDispatch();
  const activeChat = useSelector((store) => store.generalCharReducer.activeChat);
  const currentUser = useSelector((store) => store.authReducer.user);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isShopCatalogOpen, setIsShopCatalogOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [showPinned, setShowPinned] = useState(true);
  const [activeNav, setActiveNav] = useState("chats");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const activeChatRef = useRef(activeChat);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    activeChatRef.current = activeChat;
    currentUserRef.current = currentUser;
    setIsShopCatalogOpen(false);
    setReplyMessage(null);
  }, [activeChat, currentUser]);

  useEffect(() => {
    if (activeChat.type === "shop_dashboard" || activeChat.type === "reels" || activeChat.type === "none") return;

    dispatch(chatRequest());
    if (activeChat.type === "general") {
      socket.emit("getGeneralMessages");
    } else if (activeChat.type === "private") {
      socket.emit("getPrivateMessages", { targetUserId: activeChat.user._id });
      socket.emit("markAsSeen", { chatType: "private", senderId: activeChat.user._id });
    } else if (activeChat.type === "group") {
      socket.emit("getGroupMessages", { groupId: activeChat.group._id });
      socket.emit("markAsSeen", { chatType: "group", groupId: activeChat.group._id });
    }
  }, [activeChat, dispatch]);

  useEffect(() => {
    // Fetch initial online list, private partners, and group list from backend
    socket.emit("getOnlineUsers");
    socket.emit("getChatPartners");
    socket.emit("getGroups");

    const handleMessages = (messages) => {
      dispatch(chatSuccess(messages));
    };

    const handleChatError = (error) => {
      dispatch(chatFail(error));
    };

    const handleConnectError = (error) => {
      dispatch(chatFail(error.message));
    };

    const handleNewMessage = (message) => {
      if (activeChatRef.current.type === "general") {
        dispatch(addMessage(message));
      }
    };

    const handleNewPrivateMessage = (message) => {
      const currentActive = activeChatRef.current;
      const currentUserId = currentUserRef.current?._id;
      socket.emit("getChatPartners");

      if (currentActive.type === "private" && currentUserId) {
        const partnerId = currentActive.user._id;
        const msgSenderId = message.sender._id || message.sender;
        const msgReceiverId = message.receiver._id || message.receiver;

        if (
          (msgSenderId === partnerId && msgReceiverId === currentUserId) ||
          (msgSenderId === currentUserId && msgReceiverId === partnerId)
        ) {
          dispatch(addMessage(message));
          if (msgSenderId === partnerId) {
            socket.emit("markAsSeen", { chatType: "private", senderId: partnerId });
          }
        }
      }
    };

    const handleNewGroupMessage = (message) => {
      const currentActive = activeChatRef.current;
      const currentUserId = currentUserRef.current?._id;
      socket.emit("getGroups");

      if (currentActive.type === "group" && currentUserId) {
        const currentGroupId = currentActive.group._id;
        const msgGroupId = message.group._id || message.group;

        if (msgGroupId === currentGroupId) {
          dispatch(addMessage(message));
          socket.emit("markAsSeen", { chatType: "group", groupId: currentGroupId });
        }
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      dispatch(removeMessage({ messageId }));
    };

    const handleMessageUpdated = ({ chatType, message }) => {
      dispatch(updateMessage(message));
    };

    const handleMessagesMarkedAsSeen = () => {
      dispatch(markMessagesAsSeen());
    };

    const handleOnlineUsers = (users) => {
      dispatch(setOnlineUsers(users));
    };

    const handleUserOnline = (user) => {
      dispatch(addOnlineUser(user));
    };

    const handleUserOffline = ({ userId }) => {
      dispatch(removeOnlineUser(userId));
    };

    const handleUserTyping = ({ userId, name, avatar, chatType, groupId }) => {
      dispatch(
        addTypingUser({
          userId,
          name,
          avatar,
          chatType,
          groupId,
        })
      );
    };

    const handleUserStopTyping = ({ userId }) => {
      dispatch(removeTypingUser(userId));
    };

    const handleGroupsList = (groups) => {
      dispatch(setGroups(groups));
    };

    const handleGroupCreated = (group) => {
      dispatch(addGroup(group));
      socket.emit("joinGroup", { groupId: group._id });
      socket.emit("getGroups");
    };

    const handleChatPartners = (partners) => {
      dispatch(setPrivateChats(partners));
    };

    // Socket Event listeners
    socket.on("generalMessages", handleMessages);
    socket.on("privateMessages", handleMessages);
    socket.on("groupMessages", handleMessages);

    socket.on("generalChatError", handleChatError);
    socket.on("chatError", handleChatError);
    socket.on("connect_error", handleConnectError);

    socket.on("newGeneralMessage", handleNewMessage);
    socket.on("newPrivateMessage", handleNewPrivateMessage);
    socket.on("newGroupMessage", handleNewGroupMessage);

    socket.on("messageDeletedForMe", handleMessageDeleted);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("messagesSeen", handleMessagesMarkedAsSeen);

    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);

    socket.on("groupsList", handleGroupsList);
    socket.on("groupCreated", handleGroupCreated);
    socket.on("chatPartners", handleChatPartners);

    return () => {
      socket.off("generalMessages", handleMessages);
      socket.off("privateMessages", handleMessages);
      socket.off("groupMessages", handleMessages);

      socket.off("generalChatError", handleChatError);
      socket.off("chatError", handleChatError);
      socket.off("connect_error", handleConnectError);

      socket.off("newGeneralMessage", handleNewMessage);
      socket.off("newPrivateMessage", handleNewPrivateMessage);
      socket.off("newGroupMessage", handleNewGroupMessage);

      socket.off("messageDeletedForMe", handleMessageDeleted);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("messagesSeen", handleMessagesMarkedAsSeen);

      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);

      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);

      socket.off("groupsList", handleGroupsList);
      socket.off("groupCreated", handleGroupCreated);
      socket.off("chatPartners", handleChatPartners);
    };
  }, [dispatch]);

  const handleTabChange = (tabId) => {
    setActiveNav(tabId);
    if (tabId === "reels") {
      dispatch(setActiveChat({ type: "reels" }));
    } else if (tabId === "shop") {
      dispatch(setActiveChat({ type: "shop_dashboard" }));
    } else if (tabId === "chats") {
      dispatch(setActiveChat({ type: "none" }));
    } else if (tabId === "users") {
      dispatch(setActiveChat({ type: "none" }));
    }
  };

  const isConversationOpen = activeChat.type === "general" || activeChat.type === "private" || activeChat.type === "group";
  const showSidebarOnDesktop = activeChat.type !== "reels" && activeChat.type !== "shop_dashboard" && activeNav !== "users";

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-white dark:bg-[#0b0c14] transition-colors duration-200 relative">
      <PrimarySidebar
        activeNav={activeNav}
        onTabChange={handleTabChange}
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        onProfileClick={() => setIsProfileModalOpen(true)}
      />

      <div className="hidden md:flex h-full shrink-0">
        {showSidebarOnDesktop && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        )}
        {activeNav === "users" && (
          <ActiveUsers isOpen={true} onClose={() => {}} />
        )}
      </div>

      {!isConversationOpen && activeChat.type === "none" && (
        <div className="flex md:hidden flex-1 h-[calc(100vh-60px)] overflow-hidden bg-white dark:bg-[#0c0d14] w-full">
          {activeNav === "chats" && (
            <Sidebar isMobileInline={true} isOpen={false} onClose={() => {}} />
          )}
          {activeNav === "users" && (
            <ActiveUsers isMobileInline={true} isOpen={true} onClose={() => {}} />
          )}
        </div>
      )}

      <main className={`flex min-w-0 flex-1 flex-col bg-white dark:bg-[#0b0c14] transition-colors duration-200 ${
        !isConversationOpen && activeChat.type === "none" ? "hidden md:flex" : "flex h-full"
      } ${
        !isConversationOpen && (activeChat.type === "reels" || activeChat.type === "shop_dashboard") ? "h-[calc(100vh-60px)] md:h-full" : "h-full"
      }`}>
        
        {activeChat.type === "none" ? (
          <ChatLandingPage />
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {activeChat.type !== "shop_dashboard" && activeChat.type !== "reels" && (
              <ChatHeader
                onMenuClick={() => setIsSidebarOpen(true)}
                onUsersClick={() => setIsUsersOpen(true)}
                onShopClick={() => setIsShopCatalogOpen(!isShopCatalogOpen)}
                onCartClick={() => setIsCartOpen(true)}
              />
            )}

            {showPinned && activeChat.type === "general" && (
              <div className="px-5 pt-3 shrink-0">
                <div className="flex items-center justify-between rounded-xl bg-[#f0effc]/70 border border-violet-100/40 p-4 shadow-xs dark:bg-[#1a153a]/25 dark:border-violet-900/30">
                  <div className="flex items-center gap-3">
                    <span className="text-violet-600 dark:text-violet-400"><Pin size={16} className="-rotate-45" /></span>
                    <div>
                      <p className="text-xs font-bold text-violet-700 dark:text-violet-400">Pinned Message</p>
                      <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5">
                        Welcome to General Chat! Be respectful and kind to everyone.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPinned(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition p-1 rounded-lg"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

            {activeChat.type === "shop_dashboard" ? (
              <div className="flex-1 overflow-hidden h-full bg-white dark:bg-[#0b0c14]">
                <ShopDashboard />
              </div>
            ) : activeChat.type === "reels" ? (
              <div className="flex-1 overflow-hidden h-full flex justify-center bg-black">
                <ReelsSection />
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden h-full">
                <MessageList onReply={setReplyMessage} />
                <ChatInput reply={replyMessage} onCancelReply={() => setReplyMessage(null)} />
              </div>
            )}
          </div>
        )}
      </main>

      {activeChat.type === "private" ? (
        <StorefrontCatalog
          isOpen={isShopCatalogOpen}
          onClose={() => setIsShopCatalogOpen(false)}
          sellerId={activeChat.user?._id}
          sellerName={activeChat.user?.name}
        />
      ) : activeChat.type === "group" ? (
        <StorefrontCatalog
          isOpen={isShopCatalogOpen}
          onClose={() => setIsShopCatalogOpen(false)}
          sellerId={activeChat.group?.creator?._id || activeChat.group?.creator}
          sellerName={activeChat.group?.creator?.name || "Group Creator"}
        />
      ) : activeChat.type === "general" ? (
        <ActiveUsers
          isOpen={isUsersOpen}
          onClose={() => setIsUsersOpen(false)}
        />
      ) : null}

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={currentUser?._id || currentUser?.id}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default Home;