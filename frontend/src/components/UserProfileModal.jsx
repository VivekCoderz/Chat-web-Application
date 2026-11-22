import { useState, useEffect } from "react";
import {
  X,
  Camera,
  Shield,
  User,
  Store,
  Globe,
  PhoneCall,
  Info,
  Edit,
  Save,
  ArrowLeft,
  Star,
  Play,
  Heart,
  MessageCircle,
  ShoppingBag,
  Users,
  CheckCircle,
  Eye,
  Send,
  Bookmark,
  Share2,
  MoreHorizontal,
  ShoppingCart
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import api from "../config";
import { loadUserSuccess } from "../Redux/feature/authSlice";
import { socket } from "../socket/socket";
import { addToCart } from "./ShoppingCart";
import { setActiveChat } from "../Redux/feature/generalChatSlice";
import { useNavigate } from "react-router-dom";

const PRESET_ABOUTS = [
  "Available",
  "Busy",
  "At school",
  "At the movies",
  "At work",
  "Battery about to die",
  "In a meeting",
  "At the gym",
  "Sleeping",
  "Urgent calls only",
  "Hey there! I am using NexaChat.",
];

const UserProfileModal = ({ isOpen, onClose, userId, isPage = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((store) => store.authReducer.user);
  const onlineUsers = useSelector((store) => store.onlineUsers.users);
  
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  
  // Tab control
  const [activeTab, setActiveTab] = useState("overview");

  // Form fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [bio, setBio] = useState("");
  const [whatsappAbout, setWhatsappAbout] = useState("");
  const [shopName, setShopName] = useState("");
  const [instagramLink, setInstagramLink] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  
  const [avatar, setAvatar] = useState("");
  const [shopImage, setShopImage] = useState("");
  
  // User specific feeds
  const [products, setProducts] = useState([]);
  const [userReels, setUserReels] = useState([]);

  // Followers & Following state
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const isCurrentUser = currentUser?._id === userId || currentUser?.id === userId;
  const shouldShow = isPage || isOpen;

  useEffect(() => {
    if (!shouldShow || !userId) return;
    
    const fetchUser = async () => {
      setLoading(true);
      try {
        if (isCurrentUser) {
          setUser(currentUser);
          initForm(currentUser);
        } else {
          const res = await api.get(`/auth/user/${userId}`);
          setUser(res.data.user);
          initForm(res.data.user);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [shouldShow, userId, currentUser]);

  useEffect(() => {
    if (!shouldShow || !userId) return;

    socket.emit("getSellerProducts", { sellerId: userId });
    socket.emit("getReels");

    const handleSellerProducts = (prodList) => {
      setProducts(prodList);
    };

    const handleReelsList = (list) => {
      const ownReels = list.filter((r) => (r.seller?._id || r.seller) === userId);
      setUserReels(ownReels);
    };

    socket.on("sellerProducts", handleSellerProducts);
    socket.on("reelsList", handleReelsList);

    return () => {
      socket.off("sellerProducts", handleSellerProducts);
      socket.off("reelsList", handleReelsList);
    };
  }, [shouldShow, userId]);

  useEffect(() => {
    if (!shouldShow || !userId) return;

    const handleFollowStatusUpdated = ({ targetUserId, isFollowing: status, followersCount: fCount, followingCount: folCount }) => {
      if (targetUserId === userId) {
        setIsFollowing(status);
        setFollowersCount(fCount);
        setFollowingCount(folCount);
      }
    };

    const handleUserFollowersUpdated = ({ userId: uId, followersCount: fCount }) => {
      if (uId === userId) {
        setFollowersCount(fCount);
      }
    };

    socket.on("followStatusUpdated", handleFollowStatusUpdated);
    socket.on("userFollowersUpdated", handleUserFollowersUpdated);

    return () => {
      socket.off("followStatusUpdated", handleFollowStatusUpdated);
      socket.off("userFollowersUpdated", handleUserFollowersUpdated);
    };
  }, [shouldShow, userId]);

  const handleToggleFollow = () => {
    socket.emit("followUser", { targetUserId: userId });
  };

  const handleStartChat = () => {
    if (!user) return;
    dispatch(setActiveChat({ type: "private", user }));
    navigate("/");
  };

  const initForm = (u) => {
    if (!u) return;
    setName(u.name || "");
    setRole(u.role || "user");
    setBio(u.bio || "");
    setWhatsappAbout(u.whatsappAbout || "");
    setShopName(u.shopName || "");
    setInstagramLink(u.instagramLink || "");
    setWhatsappLink(u.whatsappLink || "");
    setAvatar(u.avatar || "");
    setShopImage(u.shopImage || "");
    setFollowersCount(u.followers?.length || 0);
    setFollowingCount(u.following?.length || 0);
    
    if (currentUser) {
      setIsFollowing(u.followers?.includes(currentUser._id || currentUser.id) || false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadProgress("Uploading...");
    try {
      const res = await api.post("/auth/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (type === "avatar") {
        setAvatar(res.data.url);
      } else {
        setShopImage(res.data.url);
      }
      setUploadProgress("Upload complete!");
      setTimeout(() => setUploadProgress(""), 2000);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadProgress("Upload failed.");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put("/auth/profile", {
        name,
        role,
        bio,
        whatsappAbout,
        shopName,
        shopImage,
        avatar,
        instagramLink,
        whatsappLink,
      });
      
      dispatch(loadUserSuccess(res.data.user));
      setUser(res.data.user);
      setIsEditing(false);
      
      socket.emit("getOnlineUsers");
    } catch (err) {
      console.error("Update profile failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  if (!shouldShow || !userId || !user) {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 text-violet-650 bg-white dark:bg-[#0c0d14] h-full w-full">
          <span className="text-xs font-bold animate-pulse">Loading Profile...</span>
        </div>
      );
    }
    return null;
  }

  const isOnline = onlineUsers.some((u) => u.userId === userId || u.id === userId);

  const renderContent = () => {
    return (
      <div className={`relative w-full bg-white dark:bg-[#0c0d14] flex flex-col transition-all duration-200 ${
        isPage ? "max-w-4xl rounded-3xl border border-gray-200/50 dark:border-slate-800/80 shadow-sm" : "max-w-2xl rounded-3xl max-h-[85vh] overflow-y-auto"
      }`}>
        
        {/* Cover Photo / Banner */}
        <div className="relative h-44 sm:h-56 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 shrink-0 overflow-hidden">
          {(shopImage || user.shopImage) ? (
            <img
              src={isEditing ? shopImage : user.shopImage}
              alt="Profile Cover"
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 select-none">
              <h2 className="text-white text-xl sm:text-2xl font-black tracking-widest uppercase">MOVE. FLEX. OWN.</h2>
              <span className="text-[10px] text-white tracking-widest mt-1 block uppercase">Style That Talks • Nexa Spotlight</span>
            </div>
          )}

          {/* Edit Cover Trigger */}
          {isCurrentUser && isEditing && (
            <label className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition shadow-sm backdrop-blur-xs select-none">
              <Camera size={12} />
              Change Cover
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "shopImage")}
                className="hidden"
              />
            </label>
          )}

          {/* Top Actions */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
            {isPage ? (
              <button
                onClick={() => window.history.back()}
                className="rounded-full bg-black/40 hover:bg-black/65 p-2 text-white transition flex items-center justify-center cursor-pointer shadow-md"
                title="Go Back"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button className="rounded-full bg-black/40 hover:bg-black/65 p-2 text-white transition cursor-pointer shadow-md">
                <Share2 size={15} />
              </button>
              <button className="rounded-full bg-black/40 hover:bg-black/65 p-2 text-white transition cursor-pointer shadow-md">
                <MoreHorizontal size={15} />
              </button>
              {!isPage && (
                <button
                  onClick={handleClose}
                  className="rounded-full bg-black/40 hover:bg-black/65 p-2 text-white transition cursor-pointer shadow-md"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info Details Header Block */}
        <div className="px-6 pb-6 relative flex flex-col md:flex-row md:items-end justify-between -mt-12 shrink-0 border-b border-gray-100 dark:border-slate-800/60 bg-white dark:bg-[#0c0d14]">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Avatar block with Online green status ring */}
            <div className="relative h-28 w-28 rounded-full border-4 border-white dark:border-[#0c0d14] bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 overflow-hidden shadow-md flex items-center justify-center shrink-0">
              {(isEditing ? avatar : user.avatar) ? (
                <img
                  src={isEditing ? avatar : user.avatar}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black">{user.name?.charAt(0).toUpperCase()}</span>
              )}
              {isCurrentUser && isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/55 text-white cursor-pointer opacity-0 hover:opacity-100 transition duration-200">
                  <Camera size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "avatar")}
                    className="hidden"
                  />
                </label>
              )}
              {isOnline && (
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#0c0d14] bg-emerald-500 shadow-sm" />
              )}
            </div>

            <div className="space-y-1 pb-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-b border-violet-400 dark:border-slate-700 bg-transparent text-gray-900 dark:text-white text-lg font-black focus:outline-none focus:border-violet-600 w-48"
                  />
                ) : (
                  <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                    {user.name}
                    {user.role === "seller" && (
                      <CheckCircle size={15} className="text-violet-600 dark:text-violet-450 fill-violet-600/10" />
                    )}
                  </h2>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-550">@{user.email?.split("@")[0]}</p>
              
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap text-[11px] text-gray-505 dark:text-slate-400 font-semibold">
                <span className="bg-gray-100 dark:bg-slate-800/40 px-2 py-0.5 rounded-md text-[10px] tracking-wide uppercase font-bold text-gray-600 dark:text-slate-300">
                  {user.role === "seller" ? "Shop Seller" : "Nexa Member"}
                </span>
                <span>•</span>
                <span>India</span>
                <span>•</span>
                <a href={user.instagramLink || "#"} target="_blank" rel="noreferrer" className="hover:underline text-violet-600 dark:text-violet-400 font-bold">
                  {user.instagramLink ? user.instagramLink.replace("https://", "") : "nexa.com/profile"}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Header Actions (Message / Follow / Edit) */}
          <div className="mt-5 md:mt-0 flex gap-2.5 justify-center sm:justify-start shrink-0">
            {isCurrentUser ? (
              isEditing ? (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 text-xs font-extrabold shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Save size={13} />
                  <span>Save Changes</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-slate-800 bg-[#f7f7fc]/50 hover:bg-[#eef2fe]/35 text-gray-700 dark:text-slate-200 dark:hover:bg-slate-850 py-2 px-5 text-xs font-extrabold transition shadow-xs cursor-pointer"
                >
                  <Edit size={13} />
                  <span>Edit Profile</span>
                </button>
              )
            ) : (
              <>
                <button
                  onClick={handleToggleFollow}
                  className={`rounded-full px-5 py-2 text-xs font-extrabold shadow-xs transition active:scale-95 duration-150 cursor-pointer ${
                    isFollowing
                      ? "bg-gray-100 hover:bg-gray-205 text-gray-700 dark:bg-slate-800 dark:text-slate-200"
                      : "bg-violet-600 hover:bg-violet-700 text-white"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow Seller"}
                </button>
                <button
                  onClick={handleStartChat}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850 px-4 py-2 text-xs font-extrabold text-gray-700 dark:text-slate-200 transition active:scale-95 cursor-pointer"
                >
                  <MessageCircle size={14} />
                  <span>Message</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 6-Column Statistics Grid Counter Panel */}
        <div className="grid grid-cols-3 md:grid-cols-6 border-b border-gray-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/10 text-center select-none divide-x divide-gray-105 dark:divide-slate-800/30">
          <div className="py-3.5">
            <span className="block text-base font-black text-gray-900 dark:text-white">{userReels.length}</span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 block">Posts</span>
          </div>
          <div className="py-3.5">
            <span className="block text-base font-black text-gray-900 dark:text-white">
              {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}K` : followersCount}
            </span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mt-0.5 block">Followers</span>
          </div>
          <div className="py-3.5">
            <span className="block text-base font-black text-gray-900 dark:text-white">{followingCount}</span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 block">Following</span>
          </div>
          <div className="py-3.5">
            <span className="block text-base font-black text-gray-900 dark:text-white">{products.length}</span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 block">Shops</span>
          </div>
          <div className="py-3.5">
            <span className="block text-base font-black text-gray-900 dark:text-white">
              {products.length > 0 ? (products.length * 15 + userReels.reduce((acc, r) => acc + (r.likes?.length || 0), 0)) : 0}
            </span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 block">Orders</span>
          </div>
          <div className="py-3.5 flex flex-col justify-center items-center">
            <span className="text-base font-black text-amber-500 flex items-center gap-0.5 justify-center">
              <Star size={13} className="fill-amber-500 stroke-amber-500" />
              <span>4.9</span>
            </span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 block">Rating</span>
          </div>
        </div>
        {/* Tab Selection Bar Row */}
        <div className="flex border-b border-gray-150 dark:border-slate-800/40 bg-white dark:bg-[#0c0d14] overflow-x-auto select-none shrink-0 px-3 scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: Globe },
            { id: "spotlights", label: "NexaSpotlight", icon: Play },
            { id: "shop", label: "Shop", icon: Store },
            { id: "saved", label: "Saved & Wishlist", icon: Bookmark },
            { id: "about", label: "About", icon: Info }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-3 px-5 text-xs font-bold tracking-wide uppercase transition-all duration-150 border-b-2 relative -mb-[2px] shrink-0 cursor-pointer ${
                  isActive
                    ? "border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-455"
                    : "border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                }`}
              >
                <Icon size={13} className={isActive ? "stroke-violet-600 dark:stroke-violet-400" : "stroke-gray-400 dark:stroke-slate-500"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents Block */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/5">
          
          {uploadProgress && (
            <div className="text-center text-xs font-bold text-violet-600 dark:text-violet-400 animate-pulse">
              {uploadProgress}
            </div>
          )}

          {/* ==================== OVERVIEW TAB ==================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* 3-Column Info Cards (About / Activity / Online Status) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* About Me Card */}
                <div className="bg-white dark:bg-[#131522] border border-gray-150 dark:border-slate-800/60 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mb-2">About Me</h3>
                    <p className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed font-medium">
                      {user.bio || "No bio details added. Click Edit Profile to add a custom developer/seller introduction!"}
                    </p>
                  </div>
                  <div className="mt-4">
                    <span className="inline-block bg-violet-50 dark:bg-violet-950/20 text-violet-750 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30 px-3 py-1 rounded-full text-[9px] font-extrabold tracking-wide uppercase">
                      Open to Collaborate
                    </span>
                  </div>
                </div>

                {/* Activity Statistics Card */}
                <div className="bg-white dark:bg-[#131522] border border-gray-150 dark:border-slate-800/60 rounded-3xl p-5 shadow-xs">
                  <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Activity Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-900/50">
                        <Play size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-800 dark:text-slate-100">Posted {userReels.length} Videos</p>
                        <p className="text-[9px] text-gray-400 font-semibold">Short Spotlight clips</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-900/50">
                        <ShoppingBag size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-800 dark:text-slate-100">Catalog active</p>
                        <p className="text-[9px] text-gray-400 font-semibold">{products.length} listed items</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-900/50">
                        <Users size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-800 dark:text-slate-100">{followersCount} Connections</p>
                        <p className="text-[9px] text-gray-400 font-semibold">Real followers</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Online Card */}
                <div className="bg-white dark:bg-[#131522] border border-gray-150 dark:border-slate-800/60 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Member Status</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-200">Currently</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white ${
                        isOnline ? "bg-emerald-500 shadow-sm shadow-emerald-500/10" : "bg-gray-450 dark:bg-slate-700"
                      }`}>
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-550 mt-2 leading-relaxed">
                      "{user.whatsappAbout || "Hey there! I am using NexaChat."}"
                    </p>
                  </div>
                  {!isCurrentUser && (
                    <button
                      onClick={handleStartChat}
                      className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-750 dark:bg-[#251e4d]/30 dark:text-violet-400 py-2.5 text-xs font-black transition active:scale-95 border border-violet-100/50 dark:border-violet-900/20 shadow-xs cursor-pointer"
                    >
                      <Send size={13} />
                      <span>Start a Chat</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Spotlight Videos Horizontal Row */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1">
                    <Play size={13} className="text-violet-650 fill-violet-600" />
                    <span>NexaSpotlight (Short Videos)</span>
                  </h3>
                  <button onClick={() => setActiveTab("spotlights")} className="text-[10px] font-bold text-violet-605 dark:text-violet-400 hover:underline">
                    View All
                  </button>
                </div>

                {userReels.length === 0 ? (
                  <div className="text-center py-6 bg-white dark:bg-[#131522] rounded-3xl border border-gray-150 dark:border-slate-800/40 text-xs text-gray-400">
                    No videos posted yet.
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none select-none">
                    {userReels.map((reel) => (
                      <div
                        key={reel._id}
                        onClick={() => navigate("/spotlight")}
                        className="w-36 h-56 rounded-3xl bg-slate-950 border border-gray-250 dark:border-slate-800/50 shrink-0 overflow-hidden relative group cursor-pointer shadow-xs"
                      >
                        <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-3 flex flex-col justify-end">
                          <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-auto relative group-hover:scale-110 transition pointer-events-none">
                            <Play size={10} className="text-white fill-white ml-0.5" />
                          </div>
                          <span className="text-[10px] font-extrabold text-white truncate block">{reel.caption || "Spotlight"}</span>
                          <span className="text-[8px] text-gray-300 font-semibold mt-0.5 flex items-center gap-0.5">
                            <Eye size={9} />
                            {(reel.likes?.length * 4 + 12).toLocaleString()} views
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Products Catalog Horizontal Row */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Store size={13} className="text-pink-500" />
                    <span>My Shop</span>
                  </h3>
                  <button onClick={() => setActiveTab("shop")} className="text-[10px] font-bold text-violet-650 dark:text-violet-400 hover:underline">
                    View Shop
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-6 bg-white dark:bg-[#131522] rounded-3xl border border-gray-150 dark:border-slate-800/40 text-xs text-gray-400">
                    No products posted in shop yet.
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none select-none">
                    {products.map((p) => (
                      <div
                        key={p._id}
                        className="w-40 bg-white dark:bg-[#131522] border border-gray-200/70 dark:border-slate-800/60 rounded-3xl p-3 shrink-0 flex flex-col justify-between shadow-xs"
                      >
                        <div className="w-full h-24 bg-slate-50 dark:bg-slate-950/40 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-900 relative">
                          <img src={p.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff"} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="mt-2.5 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.name}</h4>
                          <span className="text-[11px] font-black text-violet-700 dark:text-violet-400 block mt-0.5">₹{p.price.toLocaleString()}</span>
                        </div>
                        <button
                          onClick={() => {
                            addToCart(p, userId, user.shopName || user.name);
                            alert(`${p.name} added to cart!`);
                          }}
                          className="w-full mt-3 flex items-center justify-center gap-1 py-1.5 rounded-xl border border-violet-200 dark:border-violet-900/30 hover:bg-violet-50 dark:hover:bg-violet-950/20 text-violet-700 dark:text-violet-400 text-[10px] font-extrabold transition active:scale-95 cursor-pointer shadow-xs"
                        >
                          <ShoppingCart size={11} />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Overlapping Followers list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                {/* Following list banner */}
                <div className="bg-white dark:bg-[#131522] border border-gray-150 dark:border-slate-800/60 rounded-3xl p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider">Following ({followingCount})</h4>
                    <div className="flex -space-x-2 mt-2">
                      {onlineUsers.slice(0, 5).map((u, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#131522] bg-slate-800 overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                          {u.avatar ? (
                            <img src={u.avatar} alt="Follower" className="w-full h-full object-cover" />
                          ) : (
                            u.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                      {followingCount > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#131522] bg-slate-205 dark:bg-slate-800 flex items-center justify-center text-[9px] font-extrabold text-gray-500 dark:text-slate-400 shadow-sm">
                          +{followingCount - 5}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("about")} className="text-[10px] font-bold text-violet-650 dark:text-violet-400 hover:underline">
                    View All
                  </button>
                </div>

                {/* Followers list banner */}
                <div className="bg-white dark:bg-[#131522] border border-gray-150 dark:border-slate-800/60 rounded-3xl p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider">Followers ({followersCount})</h4>
                    <div className="flex -space-x-2 mt-2">
                      {onlineUsers.slice(1, 6).map((u, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#131522] bg-slate-800 overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                          {u.avatar ? (
                            <img src={u.avatar} alt="Follower" className="w-full h-full object-cover" />
                          ) : (
                            u.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                      {followersCount > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#131522] bg-slate-205 dark:bg-slate-800 flex items-center justify-center text-[9px] font-extrabold text-gray-500 dark:text-slate-400 shadow-sm">
                          +{followersCount - 5}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("about")} className="text-[10px] font-bold text-violet-650 dark:text-violet-400 hover:underline">
                    View All
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ==================== SPOTLIGHT TAB ==================== */}
          {activeTab === "spotlights" && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">Uploaded Spotlights ({userReels.length})</h3>
              {userReels.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-[#131522] rounded-3xl border border-gray-150 dark:border-slate-800/40 text-xs text-gray-400">
                  No Spotlights uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {userReels.map((reel) => (
                    <div
                      key={reel._id}
                      onClick={() => navigate("/spotlight")}
                      className="h-64 rounded-3xl bg-slate-950 border border-gray-250 dark:border-slate-800/50 overflow-hidden relative group cursor-pointer shadow-xs"
                    >
                      <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4 flex flex-col justify-end">
                        <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-auto relative group-hover:scale-110 transition pointer-events-none">
                          <Play size={12} className="text-white fill-white ml-0.5" />
                        </div>
                        <span className="text-xs font-bold text-white truncate block">{reel.caption || "Spotlight Clip"}</span>
                        <span className="text-[9px] text-gray-300 font-semibold mt-0.5 flex items-center gap-0.5">
                          <Eye size={10} />
                          {(reel.likes?.length * 5 + 15).toLocaleString()} views
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== SHOP TAB ==================== */}
          {activeTab === "shop" && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">Product Catalog ({products.length})</h3>
              {products.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-[#131522] rounded-3xl border border-gray-150 dark:border-slate-800/40 text-xs text-gray-400">
                  No storefront products listed.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {products.map((p) => (
                    <div
                      key={p._id}
                      className="bg-white dark:bg-[#131522] border border-gray-200/70 dark:border-slate-800/60 rounded-3xl p-3 flex flex-col justify-between shadow-xs"
                    >
                      <div className="w-full h-32 bg-slate-50 dark:bg-slate-950/40 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-900 relative">
                        <img src={p.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff"} alt={p.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="mt-2.5 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.name}</h4>
                        <span className="text-xs font-black text-violet-605 dark:text-violet-405 block mt-0.5">₹{p.price.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => {
                          addToCart(p, userId, user.shopName || user.name);
                          alert(`${p.name} added to cart!`);
                        }}
                        className="w-full mt-3.5 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-violet-200 dark:border-violet-900/30 hover:bg-violet-50 dark:hover:bg-violet-950/20 text-violet-700 dark:text-violet-400 text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                      >
                        <ShoppingCart size={12} />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== SAVED TAB ==================== */}
          {activeTab === "saved" && (
            <div className="space-y-6">
              
              {/* Saved Spotlights (Short Videos) */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Bookmark size={14} className="text-violet-650" />
                  <span>Bookmarked Spotlights ({JSON.parse(localStorage.getItem("nexasavedreels") || "[]").length})</span>
                </h3>
                {JSON.parse(localStorage.getItem("nexasavedreels") || "[]").length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-[#131522] rounded-3xl border border-gray-200/50 dark:border-slate-800/40 text-xs text-gray-400">
                    No saved spotlights. Watch videos in Spotlight and tap bookmark to save.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {JSON.parse(localStorage.getItem("nexasavedreels") || "[]").map((reel) => (
                      <div
                        key={reel._id}
                        onClick={() => navigate("/spotlight")}
                        className="h-44 rounded-2xl bg-black overflow-hidden relative group cursor-pointer border border-gray-200/40 dark:border-slate-800/40 shadow-xs"
                      >
                        <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent p-2.5 flex flex-col justify-end">
                          <span className="text-[10px] font-bold text-white truncate block">{reel.caption || "Spotlight"}</span>
                          <span className="text-[8px] text-gray-300 font-semibold mt-0.5">Watch Video</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Wishlist Products */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Heart size={14} className="text-rose-500 fill-rose-500" />
                  <span>Wishlisted Products ({JSON.parse(localStorage.getItem("nexawishlist") || "[]").length})</span>
                </h3>
                {JSON.parse(localStorage.getItem("nexawishlist") || "[]").length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-[#131522] rounded-3xl border border-gray-200/50 dark:border-slate-800/40 text-xs text-gray-400">
                    No items in your wishlist. Browse shop storefronts and click heart overlay to add.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {JSON.parse(localStorage.getItem("nexawishlist") || "[]").map((product) => (
                      <div
                        key={product._id}
                        className="bg-white dark:bg-[#131522] border border-gray-200/60 dark:border-slate-800/45 rounded-3xl p-4 flex gap-3 shadow-xs items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900/60 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-850 relative shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{product.name}</h4>
                            <span className="text-[11px] font-black text-violet-650 dark:text-violet-400 block mt-0.5">₹{product.price.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              addToCart(product, product.seller, "Seller Store");
                            }}
                            className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-violet-600 text-white text-[10px] font-extrabold transition active:scale-95 cursor-pointer shadow-xs shrink-0 hover:bg-violet-700"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => {
                              const updated = JSON.parse(localStorage.getItem("nexawishlist") || "[]").filter(p => p._id !== product._id);
                              localStorage.setItem("nexawishlist", JSON.stringify(updated));
                              setActiveTab("overview");
                              setTimeout(() => setActiveTab("saved"), 50);
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg dark:hover:bg-rose-955/20 shrink-0 self-center border border-rose-100 dark:border-rose-950/40"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==================== ABOUT TAB ==================== */}
          {activeTab === "about" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* WhatsApp Status presets */}
              <div className="bg-white dark:bg-[#131522] rounded-3xl p-5 border border-gray-200/60 dark:border-slate-800/60 shadow-xs space-y-3">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={14} className="text-violet-500" /> Member Info Status
                </h3>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={whatsappAbout}
                      onChange={(e) => setWhatsappAbout(e.target.value)}
                      placeholder="Set custom WhatsApp status..."
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-gray-700 px-3 py-2 outline-none focus:border-violet-500"
                    />
                    <div className="flex flex-wrap gap-1">
                      {PRESET_ABOUTS.slice(0, 7).map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setWhatsappAbout(preset)}
                          className={`text-[9px] px-2.5 py-1 rounded-full border transition ${
                            whatsappAbout === preset
                              ? "bg-violet-50 border-violet-300 text-violet-750 dark:bg-violet-950/20 dark:border-violet-800"
                              : "bg-white border-gray-200 text-gray-500 dark:bg-slate-900 dark:border-slate-800"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 leading-relaxed bg-[#f7f7fc]/50 dark:bg-[#0c0d14]/40 p-3 rounded-2xl border border-gray-200/30 dark:border-slate-800/20">
                    "{user.whatsappAbout || "Hey there! I am using NexaChat."}"
                  </p>
                )}
              </div>

              {/* Bio block during editing */}
              <div className="bg-white dark:bg-[#131522] rounded-3xl p-5 border border-gray-200/60 dark:border-slate-800/60 shadow-xs space-y-3">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} className="text-violet-500" /> Biography Details
                </h3>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-gray-705 p-3 outline-none focus:border-violet-500 resize-none"
                  />
                ) : (
                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-[#f7f7fc]/50 dark:bg-[#0c0d14]/40 p-3 rounded-2xl border border-gray-200/30 dark:border-slate-800/20">
                    {user.bio ? (
                      user.bio.split(" ").map((word, idx) => {
                        if (word.startsWith("#") || word.startsWith("@")) {
                          return (
                            <span key={idx} className="text-violet-650 dark:text-violet-400 font-bold hover:underline cursor-pointer">
                              {word}{" "}
                            </span>
                          );
                        }
                        return word + " ";
                      })
                    ) : (
                      <span className="text-gray-400 dark:text-slate-600 italic">No bio written yet.</span>
                    )}
                  </p>
                )}
              </div>

              {/* Social and Contact Links */}
              <div className="bg-white dark:bg-[#131522] rounded-3xl p-5 border border-gray-200/60 dark:border-slate-800/60 shadow-xs space-y-3 md:col-span-2">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                  Social Links & Contact Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Instagram Link */}
                  <div className="flex items-center gap-3">
                    <Globe className="text-pink-500 shrink-0" size={15} />
                    {isEditing ? (
                      <input
                        type="url"
                        value={instagramLink}
                        onChange={(e) => setInstagramLink(e.target.value)}
                        placeholder="https://instagram.com/username"
                        className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-gray-700 px-3 py-1.5 outline-none"
                      />
                    ) : user.instagramLink ? (
                      <a
                        href={user.instagramLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-violet-650 dark:text-violet-400 hover:underline font-bold"
                      >
                        Instagram Profile ({user.instagramLink.split("instagram.com/")[1] || "Link"})
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-600">Instagram profile not linked</span>
                    )}
                  </div>

                  {/* WhatsApp Link */}
                  <div className="flex items-center gap-3">
                    <PhoneCall className="text-emerald-500 shrink-0" size={15} />
                    {isEditing ? (
                      <input
                        type="url"
                        value={whatsappLink}
                        onChange={(e) => setWhatsappLink(e.target.value)}
                        placeholder="https://wa.me/phone_number"
                        className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-gray-700 px-3 py-1.5 outline-none"
                      />
                    ) : user.whatsappLink ? (
                      <a
                        href={user.whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                      >
                        WhatsApp Chat ({user.whatsappLink.split("wa.me/")[1] || "Link"})
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-600">WhatsApp direct link not set</span>
                    )}
                  </div>
                </div>

                {/* Seller shop settings switches */}
                {isCurrentUser && isEditing && (
                  <div className="bg-slate-50 dark:bg-slate-950/20 rounded-2xl p-4 border border-gray-155 dark:border-slate-850/50 shadow-xs space-y-3 mt-4">
                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield size={13} /> Account Settings (Role Switches)
                    </h4>
                    
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-xs font-bold text-gray-700 dark:text-slate-350">Account Type</p>
                        <p className="text-[9px] text-gray-400">Switch to Seller to post Spotlights and Shops</p>
                      </div>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-gray-750 px-3.5 py-2 outline-none"
                      >
                        <option value="user">Member (Buyer)</option>
                        <option value="seller">Seller (Business)</option>
                      </select>
                    </div>

                    {role === "seller" && (
                      <div className="space-y-1.5 pt-3 border-t border-gray-150 dark:border-slate-800/40">
                        <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Shop Name</label>
                        <input
                          type="text"
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          placeholder="e.g. Vivek's Sneaker Hub"
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-gray-705 px-3 py-2 outline-none focus:border-violet-500"
                        />
                      </div>
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

  if (isPage) {
    return (
      <div className="w-full h-full bg-[#f7f7fc] dark:bg-[#0b0c14] overflow-y-auto flex flex-col items-center py-6 px-4 md:px-8 select-none transition-colors duration-200">
        {renderContent()}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50
      flex items-center justify-center
      bg-black/45 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        className="w-full flex justify-center"
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default UserProfileModal;