import { useState, useEffect } from "react";
import { X, Users, UserPlus, MoreVertical, ChevronDown, Plus, Camera, Trash2, Send, Heart } from "lucide-react";
import { useSelector } from "react-redux";
import { socket } from "../socket/socket";
import api from "../config";

const getUserRole = (name) => {
  if (!name) return "Frontend Developer";
  const lower = name.toLowerCase();
  if (lower.includes("vivek garg")) return "Frontend Developer";
  if (lower.includes("rahul verma")) return "Backend Developer";
  if (lower.includes("anjali singh")) return "UI/UX Designer";
  if (lower.includes("rohit kumar")) return "Full Stack Developer";
  if (lower.includes("neha patel")) return "Product Designer";
  if (lower.includes("sarthak kulkarni")) return "DevOps Engineer";
  if (lower.includes("meera iyer")) return "Content Writer";
  if (lower.includes("aman sharma")) return "Mobile Developer";
  
  if (lower.includes("rahul sharma")) return "Frontend Developer";
  if (lower.includes("aman kumar")) return "Backend Developer";
  if (lower.includes("priya singh")) return "UI Designer";
  if (lower.includes("rohit verma")) return "Developer";
  if (lower.includes("anjali")) return "Student";
  if (lower.includes("saurabh")) return "Product Manager";
  if (lower.includes("neha")) return "QA Engineer";
  
  return "Frontend Developer";
};

const ActiveUsers = ({ isOpen, onClose, isMobileInline }) => {
  const users = useSelector((store) => store.onlineUsers.users);
  const typingUsers = useSelector((store) => store.onlineUsers.typingUsers);
  const currentUser = useSelector((store) => store.authReducer.user);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const [stories, setStories] = useState([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Form states for creating status
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [statusFile, setStatusFile] = useState(null);
  const [statusTitle, setStatusTitle] = useState("");
  const [statusDescription, setStatusDescription] = useState("");
  const [taggedProductId, setTaggedProductId] = useState("");
  const [myProducts, setMyProducts] = useState([]);
  const [likedStatusIds, setLikedStatusIds] = useState([]);
  const [viewerComment, setViewerComment] = useState("");

  useEffect(() => {
    if (isCreateStatusOpen && currentUser?._id) {
      socket.emit("getSellerProducts", { sellerId: currentUser._id });
    }
  }, [isCreateStatusOpen, currentUser]);

  useEffect(() => {
    const handleSellerProducts = (products) => {
      setMyProducts(products);
    };
    socket.on("sellerProducts", handleSellerProducts);
    return () => {
      socket.off("sellerProducts", handleSellerProducts);
    };
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  useEffect(() => {
    socket.emit("getStories");

    const handleStoriesList = (list) => {
      setStories(list);
    };

    socket.on("storiesList", handleStoriesList);
    return () => {
      socket.off("storiesList", handleStoriesList);
    };
  }, []);

  // Timer effect for Story Viewer progress bar
  useEffect(() => {
    if (!activeStoryGroup) {
      setProgress(0);
      return;
    }

    const duration = 5000; // 5 seconds per status
    const intervalTime = 100;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStoryGroup, activeStoryIdx]);

  // Group stories by User
  const groupedStories = stories.reduce((acc, story) => {
    const uId = story.user?._id || story.user;
    if (!uId) return acc;
    if (!acc[uId]) {
      acc[uId] = {
        user: story.user,
        items: [],
      };
    }
    acc[uId].items.push(story);
    return acc;
  }, {});

  const storyGroups = Object.values(groupedStories);

  const handleNextStory = () => {
    if (!activeStoryGroup) return;
    if (activeStoryIdx < activeStoryGroup.items.length - 1) {
      setActiveStoryIdx(activeStoryIdx + 1);
      setProgress(0);
    } else {
      // Find next user's story
      const currentGroupIdx = storyGroups.findIndex(
        (g) => (g.user._id || g.user) === (activeStoryGroup.user._id || activeStoryGroup.user)
      );
      if (currentGroupIdx > -1 && currentGroupIdx < storyGroups.length - 1) {
        setActiveStoryGroup(storyGroups[currentGroupIdx + 1]);
        setActiveStoryIdx(0);
        setProgress(0);
      } else {
        setActiveStoryGroup(null);
        setActiveStoryIdx(0);
        setProgress(0);
      }
    }
  };

  const handlePrevStory = () => {
    if (!activeStoryGroup) return;
    if (activeStoryIdx > 0) {
      setActiveStoryIdx(activeStoryIdx - 1);
      setProgress(0);
    } else {
      // Find previous user's story
      const currentGroupIdx = storyGroups.findIndex(
        (g) => (g.user._id || g.user) === (activeStoryGroup.user._id || activeStoryGroup.user)
      );
      if (currentGroupIdx > 0) {
        setActiveStoryGroup(storyGroups[currentGroupIdx - 1]);
        const prevGroup = storyGroups[currentGroupIdx - 1];
        setActiveStoryIdx(prevGroup.items.length - 1);
        setProgress(0);
      } else {
        setProgress(0);
      }
    }
  };

  const handlePostStatus = async () => {
    if (!statusFile) return;

    const formData = new FormData();
    formData.append("file", statusFile);

    setIsUploading(true);
    try {
      const res = await api.post("/auth/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const selectedProd = myProducts.find(p => p._id === taggedProductId);

      // Send status details in stringified caption field
      socket.emit("addStory", {
        mediaUrl: res.data.url,
        caption: JSON.stringify({
          title: statusTitle,
          description: statusDescription,
          productId: taggedProductId,
          productName: selectedProd?.name || "",
          productPrice: selectedProd?.price || "",
        }),
      });

      // Reset form
      setIsCreateStatusOpen(false);
      setStatusFile(null);
      setStatusTitle("");
      setStatusDescription("");
      setTaggedProductId("");
      alert("NexaStatus update posted successfully!");
    } catch (err) {
      console.error("Failed to upload status", err);
      alert("NexaStatus update upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteStory = (storyId) => {
    if (window.confirm("Are you sure you want to delete this status update?")) {
      socket.emit("deleteStory", { storyId });
      setActiveStoryGroup(null);
      setActiveStoryIdx(0);
      setProgress(0);
    }
  };

  const handleToggleLikeStatus = () => {
    const currentItem = activeStoryGroup?.items[activeStoryIdx];
    if (!currentItem) return;

    let title = "";
    try {
      const parsed = JSON.parse(currentItem.caption);
      title = parsed.title || "Status";
    } catch (e) {
      title = "Status";
    }

    const sellerId = activeStoryGroup.user?._id || activeStoryGroup.user;

    if (likedStatusIds.includes(currentItem._id)) {
      setLikedStatusIds(prev => prev.filter(id => id !== currentItem._id));
      socket.emit("sendPrivateMessage", {
        receiverId: sellerId,
        message: `💔 Unliked your status update: "${title}"`,
      });
    } else {
      setLikedStatusIds(prev => [...prev, currentItem._id]);
      socket.emit("sendPrivateMessage", {
        receiverId: sellerId,
        message: `❤️ Liked your status update: "${title}"`,
      });
    }
  };

  const handleSendComment = () => {
    if (!viewerComment.trim()) return;
    const currentItem = activeStoryGroup?.items[activeStoryIdx];
    if (!currentItem) return;

    let title = "";
    try {
      const parsed = JSON.parse(currentItem.caption);
      title = parsed.title || "Status";
    } catch (e) {
      title = "Status";
    }

    const sellerId = activeStoryGroup.user?._id || activeStoryGroup.user;

    socket.emit("sendPrivateMessage", {
      receiverId: sellerId,
      message: `💬 Commented on status "${title}": "${viewerComment.trim()}"`,
    });

    setViewerComment("");
    alert("Comment sent directly to seller's DM!");
  };

  const handleBuyProduct = (productId, productName) => {
    const currentItem = activeStoryGroup?.items[activeStoryIdx];
    if (!currentItem) return;

    const sellerId = activeStoryGroup.user?._id || activeStoryGroup.user;
    const confirmBuy = window.confirm(
      `Confirm Order:\n\nProduct: ${productName}\n\nWould you like to place this order?`
    );

    if (confirmBuy) {
      socket.emit("createOrder", {
        sellerId,
        productId,
        quantity: 1,
      });

      socket.emit("sendPrivateMessage", {
        receiverId: sellerId,
        message: `🛒 Ordered tagged product "${productName}" directly from your status update!`,
      });

      alert("Order placed successfully! A notification and order card have been sent to your chat.");
    }
  };

  const myStoriesGroup = storyGroups.find(
    (g) => (g.user._id || g.user) === currentUser?._id
  );

  const otherStoriesGroups = storyGroups.filter(
    (g) => (g.user._id || g.user) !== currentUser?._id
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && !isMobileInline && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Active Users Sidebar */}
      <aside
        className={`
          ${isMobileInline
            ? "flex h-full w-full flex-col bg-white dark:bg-[#0c0d14]"
            : `fixed right-0 top-0 z-50 flex h-full w-[85%] max-w-sm flex-col border-l border-gray-200 bg-white shadow-xl dark:border-slate-800/80 dark:bg-[#0c0d14] transform transition-transform duration-300 ease-in-out md:static md:z-auto md:w-64 md:max-w-none md:shrink-0 md:translate-x-0 md:shadow-none ${
                isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
              }`
          }
          transition-colors duration-200
        `}
      >
        {/* Header */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 px-5 dark:border-slate-800/60 bg-white dark:bg-[#0c0d14]">
          {/* Light Theme Header */}
          <div className="dark:hidden flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900">
              Active Users
            </h2>
            <span className="rounded-md bg-[#eef2fe] px-2 py-0.5 text-xs text-[#4f46e5] font-bold">
              {users.length || 18}
            </span>
          </div>

          {/* Dark Theme Header */}
          <div className="hidden dark:flex items-center justify-between flex-1">
            <div>
              <h2 className="text-sm font-bold text-white">
                Active Users
              </h2>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                {users.length || 12} people online
              </p>
            </div>
            
            <button className="rounded-xl p-2 bg-[#131522]/80 border border-slate-800/40 text-violet-400 hover:bg-slate-800/60 transition shrink-0">
              <UserPlus size={15} />
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-slate-205 md:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Typing banner inside panel */}
        {typingUsers.length > 0 && (
          <>
            {/* Light mode typing banner */}
            <div className="dark:hidden px-5 py-2 text-xs font-bold text-[#4f46e5] animate-pulse shrink-0 bg-violet-50/30 border-b border-violet-100/30">
              ••• {typingUsers.map(u => u.name).join(", ")} is typing...
            </div>
            
            {/* Dark mode typing banner */}
            <div className="hidden dark:flex mx-3 my-2 bg-[#1b153a]/45 border border-violet-900/30 rounded-xl px-4 py-2.5 text-xs text-violet-400 font-bold items-center gap-2 animate-pulse shrink-0">
              <span className="flex gap-0.5 text-base leading-none">•••</span>
              <span className="truncate">{typingUsers.map(u => u.name).join(", ")} is typing...</span>
            </div>
          </>
        )}

        {/* NexaStatus Updates Section */}
        <div className="shrink-0 bg-transparent px-5 py-3 border-b border-gray-200/50 dark:border-slate-800/40 transition-colors duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              NexaStatus Updates
            </span>
            <button
              onClick={() => setIsCreateStatusOpen(true)}
              className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-0.5"
            >
              <Plus size={12} /> Add Update
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-none select-none">
            {/* My Status */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative">
                {myStoriesGroup ? (
                  <div
                    onClick={() => {
                      setActiveStoryGroup(myStoriesGroup);
                      setActiveStoryIdx(0);
                      setProgress(0);
                    }}
                    className="h-11 w-11 rounded-full border-2 border-violet-500 p-0.5 cursor-pointer hover:scale-105 transition"
                  >
                    <img
                      src={myStoriesGroup.user?.avatar || "https://via.placeholder.com/150"}
                      alt="My Status"
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => setIsCreateStatusOpen(true)}
                    className="h-11 w-11 rounded-full bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-extrabold relative text-xs cursor-pointer border border-dashed border-violet-300 dark:border-violet-800 hover:scale-105 transition"
                  >
                    {currentUser?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => setIsCreateStatusOpen(true)}
                  className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-violet-600 border border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-violet-700 transition shadow-sm"
                >
                  <Plus size={10} />
                </button>
              </div>
              <span className="text-[9px] text-gray-500 dark:text-slate-400 mt-1 font-semibold max-w-[50px] truncate">
                My Status
              </span>
            </div>

            {/* Other Statuses */}
            {otherStoriesGroups.map((group) => (
              <div
                key={group.user?._id || group.user}
                onClick={() => {
                  setActiveStoryGroup(group);
                  setActiveStoryIdx(0);
                  setProgress(0);
                }}
                className="flex flex-col items-center shrink-0 cursor-pointer hover:scale-105 transition"
              >
                <div className="h-11 w-11 rounded-full border-2 border-pink-500 dark:border-pink-600 p-0.5">
                  <img
                    src={group.user?.avatar || "https://via.placeholder.com/150"}
                    alt={group.user?.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <span className="text-[9px] text-gray-600 dark:text-slate-400 mt-1 font-medium truncate max-w-[55px]">
                  {group.user?.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ONLINE section label for Dark Mode */}
        <div className="hidden dark:block px-5 pt-4 pb-2">
          <p className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">ONLINE</p>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-3 bg-white dark:bg-[#0c0d14] transition-colors duration-200">
          {users.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-5 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-850">
                <Users size={22} className="text-gray-305 dark:text-slate-700" />
              </div>
              <p className="text-sm font-medium text-gray-505 dark:text-slate-400">
                No users online
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-slate-550">
                Online users will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user._id || user.id}
                  className="flex items-center justify-between rounded-xl p-2.5 transition hover:bg-gray-105/50 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-violet-100 dark:bg-[#16132b] text-xs font-semibold text-violet-650 dark:text-violet-405 border border-gray-100 dark:border-slate-800/40">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          user.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      {/* Online dot */}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#0c0d14] bg-emerald-500" />
                    </div>

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-800 dark:text-slate-200">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium mt-0.5">
                        {getUserRole(user.name)}
                      </p>
                    </div>
                  </div>

                  {/* Dark Mode Options Button */}
                  <button className="hidden dark:block p-1 text-slate-400 hover:text-slate-300 transition shrink-0 rounded-lg">
                    <MoreVertical size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA / Button */}
        <div className="p-4 border-t border-gray-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0c0d14] transition-colors duration-200 flex justify-center shrink-0">
          {/* Light Theme Button */}
          <button className="dark:hidden flex items-center justify-center gap-2 w-full rounded-xl border border-violet-200 bg-[#eef2fe]/30 hover:bg-[#eef2fe]/65 px-4 py-2.5 text-xs font-bold text-violet-700 transition">
            <Users size={14} className="text-violet-600" />
            <span>View All Users</span>
          </button>

          {/* Dark Theme Button */}
          <button className="hidden dark:flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-800 bg-[#131522]/40 hover:bg-[#131522]/80 py-2 text-xs font-bold text-slate-300 transition">
            <span>Show all users</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>
        </div>
      </aside>

      {/* ================================= */}
      {/* CREATE STATUS / UPDATE MODAL */}
      {/* ================================= */}
      {isCreateStatusOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-gray-900 dark:text-white">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 transition-colors duration-200">
            <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4">Create Status Update</h3>
            
            <div className="space-y-4">
              {/* Media Upload Selection */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase mb-1.5">
                  Photo or Video
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-gray-200 dark:border-slate-800 hover:border-violet-500 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-950/20 hover:bg-violet-50/10 transition relative group overflow-hidden">
                    {statusFile ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                        <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 truncate max-w-[200px]">
                          {statusFile.name}
                        </span>
                        <span className="text-[9px] text-gray-400 mt-0.5">
                          Click to change file
                        </span>
                      </div>
                    ) : (
                      <>
                        <Camera size={20} className="text-gray-400 group-hover:text-violet-500 transition mb-1" />
                        <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">Choose Media</span>
                        <span className="text-[8px] text-gray-400 mt-0.5">Supports images & videos</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setStatusFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase mb-1.5">
                  Update Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clearance Sale!"
                  value={statusTitle}
                  onChange={(e) => setStatusTitle(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-violet-500 focus:outline-none transition"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Tell your buyers more details..."
                  rows={3}
                  value={statusDescription}
                  onChange={(e) => setStatusDescription(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-violet-500 focus:outline-none transition resize-none"
                />
              </div>

              {/* Product Tagging Dropdown */}
              {currentUser?.role === "seller" && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase mb-1.5">
                    Tag a Storefront Product (Optional)
                  </label>
                  <select
                    value={taggedProductId}
                    onChange={(e) => setTaggedProductId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent px-3.5 py-2.5 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none transition dark:bg-slate-900"
                  >
                    <option value="" className="text-gray-500">-- Select Product to Tag --</option>
                    {myProducts.map((p) => (
                      <option key={p._id} value={p._id} className="text-gray-900 dark:text-white">
                        {p.name} (${p.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => {
                  setIsCreateStatusOpen(false);
                  setStatusFile(null);
                  setStatusTitle("");
                  setStatusDescription("");
                  setTaggedProductId("");
                }}
                className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 text-xs font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePostStatus}
                disabled={isUploading || !statusFile}
                className="flex-1 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isUploading ? "Uploading..." : "Post Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================= */}
      {/* FULL SCREEN STATUS VIEWER MODAL */}
      {/* ================================= */}
      {activeStoryGroup && (() => {
        const currentItem = activeStoryGroup.items[activeStoryIdx];
        let title = "";
        let description = "";
        let productId = "";
        let productName = "";
        let productPrice = "";
        try {
          const parsed = JSON.parse(currentItem.caption);
          title = parsed.title || "";
          description = parsed.description || "";
          productId = parsed.productId || "";
          productName = parsed.productName || "";
          productPrice = parsed.productPrice || "";
        } catch (e) {
          description = currentItem.caption || "";
        }

        const isVideo = currentItem.mediaUrl?.match(/\.(mp4|webm|ogg|mov)/i) || currentItem.mediaUrl?.includes("video");

        return (
          <div className="fixed inset-0 z-55 bg-black/95 flex items-center justify-center p-4 backdrop-blur-xs text-white">
            <div className="relative w-full max-w-sm h-[85vh] bg-black rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl border border-slate-900 select-none">
              
              {/* Top Area: Progress bars & User profile */}
              <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/85 to-transparent z-15 space-y-3">
                {/* Progress Indicator list */}
                <div className="flex gap-1">
                  {activeStoryGroup.items.map((_, idx) => (
                    <div key={idx} className="flex-1 h-1 bg-white/35 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-100 ease-linear"
                        style={{
                          width:
                            idx < activeStoryIdx
                              ? "100%"
                              : idx === activeStoryIdx
                              ? `${progress}%`
                              : "0%",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Profile details */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white bg-slate-800 flex items-center justify-center font-bold text-xs">
                      {activeStoryGroup.user?.avatar ? (
                        <img
                          src={activeStoryGroup.user.avatar}
                          alt={activeStoryGroup.user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        activeStoryGroup.user?.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs font-bold text-white shadow-sm">
                      {activeStoryGroup.user?.name || "User"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Delete button if owner */}
                    {(activeStoryGroup.user?._id || activeStoryGroup.user) === currentUser?._id && (
                      <button
                        onClick={() => handleDeleteStory(currentItem._id)}
                        className="p-1.5 rounded-full hover:bg-white/20 text-rose-400 transition"
                        title="Delete status"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => setActiveStoryGroup(null)}
                      className="p-1 rounded-full hover:bg-white/20 text-white/80 transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Middle Area: Interactive Tapping Controls */}
              <div className="flex-1 relative flex items-center justify-center bg-slate-950">
                {/* Tap Left to go back */}
                <div
                  onClick={handlePrevStory}
                  className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
                />
                
                {/* Tap Right to advance */}
                <div
                  onClick={handleNextStory}
                  className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer"
                />

                {/* Status Content */}
                {isVideo ? (
                  <video
                    src={currentItem.mediaUrl}
                    className="max-h-full max-w-full object-contain"
                    controls={false}
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={currentItem.mediaUrl}
                    alt="Status content"
                    className="max-h-full max-w-full object-contain"
                  />
                )}

                {/* Tagged Product Overlay Card */}
                {productId && (
                  <div className="absolute bottom-36 inset-x-4 bg-slate-950/85 backdrop-blur-md border border-violet-500/30 rounded-2xl p-3 flex items-center justify-between z-20 text-white pointer-events-auto shadow-lg">
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-extrabold text-violet-400 uppercase tracking-widest block mb-0.5">Tagged Product</span>
                      <h5 className="text-xs font-bold truncate pr-1">{productName}</h5>
                      <span className="text-[10px] font-extrabold text-violet-300 block mt-0.5">${parseFloat(productPrice).toFixed(2)}</span>
                    </div>
                    {currentUser && (activeStoryGroup.user?._id || activeStoryGroup.user) !== currentUser?._id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyProduct(productId, productName);
                        }}
                        className="rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition"
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Title & Description Overlay */}
              <div className="absolute bottom-16 inset-x-0 p-5 bg-gradient-to-t from-black/90 via-black/55 to-transparent text-center z-15 text-white">
                {title && (
                  <h4 className="text-xs font-black tracking-wide mb-1 drop-shadow-md">
                    {title}
                  </h4>
                )}
                {description && (
                  <p className="text-[10px] text-gray-200 leading-relaxed font-medium drop-shadow-sm max-w-xs mx-auto line-clamp-2">
                    {description}
                  </p>
                )}
              </div>

              {/* Bottom Comments & Likes Input Panel */}
              <div className="absolute bottom-3 inset-x-3 flex items-center gap-1.5 z-20 pointer-events-auto">
                <input
                  type="text"
                  placeholder="Type a comment / reply..."
                  value={viewerComment}
                  onChange={(e) => setViewerComment(e.target.value)}
                  className="flex-1 text-[11px] rounded-xl border border-white/20 bg-slate-950/90 text-white placeholder-white/40 px-3 py-2 focus:border-violet-500 focus:outline-none transition"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      handleSendComment();
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendComment();
                  }}
                  className="h-8 w-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md active:scale-95 hover:bg-violet-700 transition"
                >
                  <Send size={13} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLikeStatus();
                  }}
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shadow-md transition border ${
                    likedStatusIds.includes(currentItem._id)
                      ? "bg-rose-600 border-rose-500 text-white"
                      : "bg-slate-950/85 border-white/25 text-white hover:bg-white/10"
                  }`}
                >
                  <Heart size={13} className={likedStatusIds.includes(currentItem._id) ? "fill-white" : ""} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};

export default ActiveUsers;