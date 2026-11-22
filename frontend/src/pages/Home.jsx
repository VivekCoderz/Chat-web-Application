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
import SpotlightAnalyticsSection from "../components/SpotlightAnalyticsSection";
import { Pin, X, Sparkles, Eye, Heart, ShoppingCart as ShoppingCartIcon, ArrowRight, UserPlus, Flame, Play, Store } from "lucide-react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((store) => store.authReducer.user);
  const onlineUsers = useSelector((store) => store.onlineUsers.users);
  
  const [reels, setReels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTab, setSearchTab] = useState("all");

  useEffect(() => {
    socket.emit("getReels");
    const handleReelsList = (list) => {
      setReels(list);
    };
    socket.on("reelsList", handleReelsList);
    return () => {
      socket.off("reelsList", handleReelsList);
    };
  }, []);

  // Filter tagged products from reels
  const featuredProducts = reels
    .map((r) => r.product)
    .filter(Boolean)
    // De-duplicate products by ID
    .filter((v, i, a) => a.findIndex((t) => t._id === v._id) === i)
    .slice(0, 4);

  const trendingVideos = reels.slice(0, 4);

  // Real-time filtering
  const filteredUsers = searchQuery.trim()
    ? onlineUsers.filter((u) => u.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const filteredReels = searchQuery.trim()
    ? reels.filter((r) => r.caption?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const filteredProducts = searchQuery.trim()
    ? reels
        .map((r) => r.product)
        .filter(Boolean)
        .filter((p) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter((v, i, a) => a.findIndex((t) => t._id === v._id) === i)
    : [];

  const hasResults = filteredUsers.length > 0 || filteredReels.length > 0 || filteredProducts.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f7f7fc] dark:bg-[#08090f] overflow-y-auto select-none p-4 md:p-8 space-y-6 scrollbar-none transition-colors duration-200">
      
      {/* Search Input Box */}
      <div className="w-full shrink-0">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchTab("all");
            }}
            placeholder="Search creators, Spotlight videos, or tagged products..."
            className="w-full bg-white dark:bg-[#0c0d14] border border-gray-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-xs text-gray-800 dark:text-white outline-none focus:border-violet-500 transition shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {searchQuery.trim() !== "" ? (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Tab selector bar */}
          <div className="flex border-b border-gray-150 dark:border-slate-800/40 select-none shrink-0 scrollbar-none gap-2">
            {[
              { id: "all", label: "All Results" },
              { id: "people", label: "People" },
              { id: "spotlights", label: "Spotlights" },
              { id: "products", label: "Products" },
            ].map((tab) => {
              const isActive = searchTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSearchTab(tab.id)}
                  className={`py-2 px-3 text-[10px] font-black tracking-wide uppercase transition border-b-2 -mb-[2px] cursor-pointer ${
                    isActive
                      ? "border-violet-600 text-violet-605 dark:border-violet-400 dark:text-violet-400"
                      : "border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {!hasResults ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 bg-white dark:bg-[#0c0d14] border border-gray-200/50 dark:border-slate-800/40 rounded-3xl text-center px-4">
              <span className="text-3xl">🔍</span>
              <h3 className="text-xs font-bold text-gray-705 dark:text-slate-300 mt-3">No Results Found</h3>
              <p className="text-[10px] text-gray-400 mt-1 max-w-xs">
                We couldn't find any creators, videos, or products matching "{searchQuery}". Try typing another name!
              </p>
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto pr-1 scrollbar-none">
              
              {/* People Result Group */}
              {(searchTab === "all" || searchTab === "people") && filteredUsers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-1">Creators & Sellers</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredUsers.map((item) => (
                      <div key={item.userId || item.id} className="bg-white dark:bg-[#0c0d14] border border-gray-200/60 dark:border-slate-800/45 rounded-3xl p-4 flex items-center justify-between shadow-xs">
                        <div onClick={() => navigate(`/profile/${item.userId || item.id}`)} className="flex items-center gap-3 cursor-pointer group min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-xs font-bold text-violet-750 overflow-hidden flex items-center justify-center shadow-inner">
                              {item.avatar ? (
                                <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                item.name?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white dark:border-[#0c0d14] bg-emerald-500 animate-pulse" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 dark:text-slate-205 truncate group-hover:text-violet-650 transition">{item.name}</p>
                            <span className="text-[9px] text-gray-400 block truncate">@{item.name?.toLowerCase().replace(/\s/g, "")}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            dispatch(setActiveChat({ type: "private", user: { _id: item.userId || item.id, name: item.name, avatar: item.avatar } }));
                          }}
                          className="flex items-center gap-1 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 py-1.5 px-3 text-[10px] font-black transition active:scale-95 border border-violet-100/50 dark:border-violet-900/20 shadow-xs cursor-pointer shrink-0"
                        >
                          Chat
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spotlights Result Group */}
              {(searchTab === "all" || searchTab === "spotlights") && filteredReels.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-1">Spotlight Clips</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {filteredReels.map((reel) => (
                      <div
                        key={reel._id}
                        onClick={() => navigate("/spotlight")}
                        className="h-44 rounded-2xl bg-black overflow-hidden relative group cursor-pointer border border-gray-200/40 dark:border-slate-800/40 shadow-xs"
                      >
                        <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent p-2.5 flex flex-col justify-end">
                          <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-auto relative group-hover:scale-110 transition pointer-events-none">
                            <Play size={10} className="text-white fill-white ml-0.5" />
                          </div>
                          <span className="text-[10px] font-bold text-white truncate block">{reel.caption || "Spotlight"}</span>
                          <button className="w-full mt-2 py-1 bg-violet-600 hover:bg-violet-700 text-white text-[9px] font-extrabold rounded-lg shadow-sm transition active:scale-95">
                            Watch
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Result Group */}
              {(searchTab === "all" || searchTab === "products") && filteredProducts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider px-1">Products</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredProducts.map((p) => (
                      <div
                        key={p._id}
                        className="bg-white dark:bg-[#0c0d14] border border-gray-200/60 dark:border-slate-800/45 rounded-3xl p-4 flex gap-3 shadow-xs items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900/60 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-850 relative shrink-0">
                            <img src={p.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff"} alt={p.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.name}</h4>
                            <span className="text-[11px] font-black text-violet-600 dark:text-violet-400 block mt-0.5">₹{p.price.toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate("/shop")}
                          className="flex items-center gap-1 py-1.5 px-3 rounded-xl border border-violet-200 dark:border-violet-900/30 hover:bg-violet-50 dark:hover:bg-violet-955/20 text-violet-700 dark:text-violet-400 text-[10px] font-extrabold transition active:scale-95 cursor-pointer shadow-xs shrink-0"
                        >
                          View Product
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      ) : (
        <>
          {/* Top Banner Row */}
          <div className="bg-gradient-to-r from-violet-600 via-indigo-700 to-purple-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-md shrink-0">
            <div className="absolute right-4 bottom-0 opacity-15 pointer-events-none">
              <Sparkles size={160} />
            </div>
            <div className="max-w-md relative z-10">
              <span className="bg-white/20 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full backdrop-blur-xs">
                Nexa Platform
              </span>
              <h2 className="text-2xl font-black mt-3">Welcome to Nexa, {currentUser?.name || "Member"}!</h2>
              <p className="text-xs text-indigo-100 mt-1.5 leading-relaxed font-medium">
                Discover trending product videos, order tags directly from creators, chat in real-time, and manage your storefront.
              </p>
            </div>
          </div>

          {/* Grid of Contents */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Videos & Products */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Trending Spotlight Videos */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Flame size={14} className="text-pink-550 fill-pink-500" />
                    <span>Trending Spotlight Videos</span>
                  </h3>
                  <button
                    onClick={() => navigate("/spotlight")}
                    className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight size={10} />
                  </button>
                </div>

                {trendingVideos.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-[#0c0d14] rounded-3xl border border-gray-200/50 dark:border-slate-800/40 text-xs text-gray-405">
                    No videos posted yet. Select Spotlight from navigation to post.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {trendingVideos.map((reel) => (
                      <div
                        key={reel._id}
                        onClick={() => navigate("/spotlight")}
                        className="h-44 rounded-2xl bg-black overflow-hidden relative group cursor-pointer border border-gray-200/40 dark:border-slate-800/40 shadow-xs"
                      >
                        <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent p-2.5 flex flex-col justify-end">
                          <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-auto relative group-hover:scale-110 transition pointer-events-none">
                            <Play size={10} className="text-white fill-white ml-0.5" />
                          </div>
                          <span className="text-[10px] font-bold text-white truncate block">{reel.caption || "Spotlight"}</span>
                          <span className="text-[8px] text-gray-300 font-semibold mt-0.5 flex items-center gap-0.5">
                            <Eye size={8} />
                            {((reel.likes?.length || 0) * 5 + 12).toLocaleString()} views
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular Products Attached */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Store size={14} className="text-violet-605" />
                    <span>Popular Products Catalog</span>
                  </h3>
                  <button
                    onClick={() => navigate("/shop")}
                    className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Browse Shop</span>
                    <ArrowRight size={10} />
                  </button>
                </div>

                {featuredProducts.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-[#0c0d14] rounded-3xl border border-gray-200/50 dark:border-slate-800/40 text-xs text-gray-405">
                    No products listed yet. Create a seller shop inside Shop to get started.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {featuredProducts.map((p) => (
                      <div
                        key={p._id}
                        className="bg-white dark:bg-[#0c0d14] border border-gray-200/60 dark:border-slate-800/45 rounded-3xl p-4 flex gap-3 shadow-xs items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900/60 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-850 relative shrink-0">
                            <img src={p.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff"} alt={p.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.name}</h4>
                            <span className="text-[11px] font-black text-violet-600 dark:text-violet-400 block mt-0.5">₹{p.price.toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            navigate("/shop");
                          }}
                          className="flex items-center gap-1 py-1.5 px-3 rounded-xl border border-violet-200 dark:border-violet-900/30 hover:bg-violet-50 dark:hover:bg-violet-955/20 text-violet-750 dark:text-violet-400 text-[10px] font-extrabold transition active:scale-95 cursor-pointer shadow-xs shrink-0"
                        >
                          <ShoppingCartIcon size={11} />
                          <span>View</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right 1 Column: Online Creators & Suggestions */}
            <div className="space-y-6">
              
              {/* Online Creators & Sellers */}
              <div className="bg-white dark:bg-[#0c0d14] border border-gray-200/50 dark:border-slate-800/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-4">
                    Online Creators ({onlineUsers.length})
                  </h3>
                  {onlineUsers.length <= 1 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">No other members online currently.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {onlineUsers
                        .filter((u) => u.userId !== currentUser?._id && u.id !== currentUser?._id)
                        .slice(0, 5)
                        .map((item) => (
                          <div
                            key={item.userId || item.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <div
                              onClick={() => navigate(`/profile/${item.userId || item.id}`)}
                              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                            >
                              <div className="relative shrink-0">
                                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-xs font-bold text-violet-750 overflow-hidden flex items-center justify-center shadow-inner">
                                  {item.avatar ? (
                                    <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    item.name?.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white dark:border-[#0c0d14] bg-emerald-500 shadow-xs animate-pulse" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 dark:text-slate-205 truncate group-hover:text-violet-650 transition">
                                  {item.name}
                                </p>
                                <span className="text-[9px] text-gray-400 block truncate">@{item.name?.toLowerCase().replace(/\s/g, "")}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                dispatch(setActiveChat({ type: "private", user: { _id: item.userId || item.id, name: item.name, avatar: item.avatar } }));
                              }}
                              className="flex items-center gap-1 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-955/20 dark:text-violet-405 py-1.5 px-3 text-[10px] font-black transition active:scale-95 border border-violet-100/50 dark:border-violet-900/20 shadow-xs cursor-pointer shrink-0"
                            >
                              Chat
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Shortcuts */}
              <div className="bg-white dark:bg-[#0c0d14] border border-gray-200/50 dark:border-slate-800/40 rounded-3xl p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                  Quick Shortcuts
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      dispatch(setActiveChat({ type: "general" }));
                    }}
                    className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 border border-gray-200/20 dark:border-slate-800/30 text-xs font-bold text-gray-700 dark:text-slate-200 transition cursor-pointer"
                  >
                    💬 Open General Chatroom
                  </button>
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 border border-gray-200/20 dark:border-slate-800/30 text-xs font-bold text-gray-700 dark:text-slate-205 transition cursor-pointer"
                  >
                    👤 Manage My Seller Profile
                  </button>
                  <button
                    onClick={() => navigate("/spotlight/analytics")}
                    className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 border border-gray-200/20 dark:border-slate-800/30 text-xs font-bold text-gray-700 dark:text-slate-205 transition cursor-pointer"
                  >
                    📈 View Spotlight Reach
                  </button>
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
};

const Home = () => {
  const dispatch = useDispatch();
  const activeChat = useSelector((store) => store.generalCharReducer.activeChat);
  const currentUser = useSelector((store) => store.authReducer.user);

  const location = useLocation();
  const { userId } = useParams();
  const navigate = useNavigate();

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
    if (activeChat.type === "general" || activeChat.type === "private" || activeChat.type === "group") {
      setActiveNav("chats");
    }
  }, [activeChat.type]);

  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      setActiveNav("chats");
      if (
        activeChat.type === "reels" ||
        activeChat.type === "shop_dashboard" ||
        activeChat.type === "spotlight_analytics" ||
        activeChat.type === "profile_page"
      ) {
        dispatch(setActiveChat({ type: "none" }));
      }
    } else if (path === "/spotlight") {
      setActiveNav("reels");
      dispatch(setActiveChat({ type: "reels" }));
    } else if (path === "/spotlight/analytics") {
      setActiveNav("reels");
      dispatch(setActiveChat({ type: "spotlight_analytics" }));
    } else if (path === "/shop") {
      setActiveNav("shop");
      dispatch(setActiveChat({ type: "shop_dashboard" }));
    } else if (path === "/profile") {
      setActiveNav("chats");
      dispatch(setActiveChat({ type: "profile_page", userId: currentUser?._id || currentUser?.id }));
    } else if (path.startsWith("/profile/")) {
      setActiveNav("chats");
      dispatch(setActiveChat({ type: "profile_page", userId }));
    }
  }, [location.pathname, userId, currentUser]);

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
    if (tabId === "reels") {
      navigate("/spotlight");
    } else if (tabId === "shop") {
      navigate("/shop");
    } else if (tabId === "chats") {
      setActiveNav("chats");
      navigate("/");
    } else if (tabId === "users") {
      setActiveNav("users");
      dispatch(setActiveChat({ type: "none" }));
      navigate("/");
    }
  };

  const isConversationOpen = activeChat.type === "general" || activeChat.type === "private" || activeChat.type === "group";
  const showSidebarOnDesktop = activeChat.type !== "reels" && activeChat.type !== "shop_dashboard" && activeChat.type !== "spotlight_analytics" && activeChat.type !== "profile_page" && activeNav !== "users";

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-white dark:bg-[#0b0c14] transition-colors duration-200 relative">
      <PrimarySidebar
        activeNav={activeNav}
        onTabChange={handleTabChange}
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        onProfileClick={() => navigate("/profile")}
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
        !isConversationOpen && (activeChat.type === "reels" || activeChat.type === "shop_dashboard" || activeChat.type === "spotlight_analytics" || activeChat.type === "profile_page") ? "h-[calc(100vh-60px)] md:h-full" : "h-full"
      }`}>
        
        {activeChat.type === "none" ? (
          <ChatLandingPage />
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {activeChat.type !== "shop_dashboard" && activeChat.type !== "reels" && activeChat.type !== "spotlight_analytics" && activeChat.type !== "profile_page" && (
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
            ) : activeChat.type === "spotlight_analytics" ? (
              <div className="flex-1 overflow-hidden h-full bg-white dark:bg-[#0b0c14]">
                <SpotlightAnalyticsSection />
              </div>
            ) : activeChat.type === "profile_page" ? (
              <div className="flex-1 overflow-hidden h-full bg-white dark:bg-[#0b0c14]">
                <UserProfileModal isPage={true} userId={activeChat.userId} onClose={() => {}} />
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

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default Home;