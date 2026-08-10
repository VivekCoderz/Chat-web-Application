import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, ShoppingBag, Plus, Upload, X, Send, Play, Pause, User } from "lucide-react";
import { socket } from "../socket/socket";
import { useSelector } from "react-redux";
import api from "../config";
import UserProfileModal from "./UserProfileModal";
import { addToCart } from "./ShoppingCart";

// ReelCard subcomponent to manage individual videos
const ReelCard = ({ reel, isActive, currentUser, onLike, onCommentClick, onProductClick, onProfileClick, isFollowing, onToggleFollow }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        // Auto play when active
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Auto-play blocked, wait for user interaction.", err);
            setIsPlaying(false);
          });
      } else {
        // Pause and reset when inactive
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true));
      }
    }
  };

  const hasLiked = reel.likes?.includes(currentUser?._id || currentUser?.id);

  return (
    <div className="snap-start snap-always w-full h-full relative flex-shrink-0 flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        loop
        playsInline
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Play/Pause Overlay indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 z-10">
          <Play size={40} className="text-white/60 animate-ping" />
        </div>
      )}

      {/* Own Reel Spotlight Analytics Overlay */}
      {currentUser && (reel.seller?._id || reel.seller) === currentUser?._id && (
        <div className="absolute top-20 left-4 bg-black/60 border border-violet-500/30 rounded-2xl p-3.5 z-20 text-left max-w-[200px] pointer-events-none backdrop-blur-xs select-none shadow-lg">
          <span className="text-[9px] font-bold text-violet-400 block uppercase tracking-wider mb-1.5">Spotlight Analytics</span>
          <div className="space-y-1.5">
            <p className="text-[10px] text-white font-semibold flex items-center gap-1.5">
              ❤️ <span className="font-extrabold text-violet-300">{reel.likes?.length || 0}</span> Video Likes
            </p>
            <p className="text-[10px] text-white font-semibold flex items-center gap-1.5">
              👥 <span className="font-extrabold text-violet-300">{currentUser?.followers?.length || 0}</span> Followers
            </p>
            <p className="text-[10px] text-white font-semibold flex items-center gap-1.5">
              🔄 <span className="font-extrabold text-violet-300">{currentUser?.following?.length || 0}</span> Following
            </p>
          </div>
        </div>
      )}

      {/* Right Action Icons Panel */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-5 z-20 text-center items-center drop-shadow-lg">
        {/* Profile Avatar */}
        <div
          onClick={() => onProfileClick(reel.seller?._id || reel.seller)}
          className="w-10 h-10 rounded-full border-2 border-violet-500 bg-violet-900/40 text-violet-305 font-bold overflow-hidden cursor-pointer hover:scale-105 transition flex items-center justify-center text-xs"
        >
          {reel.seller?.avatar ? (
            <img src={reel.seller.avatar} alt={reel.seller.name} className="h-full w-full object-cover" />
          ) : (
            reel.seller?.name?.charAt(0).toUpperCase()
          )}
        </div>

        {/* Like Button */}
        <button
          onClick={() => onLike(reel._id)}
          className="flex flex-col items-center gap-1 group text-white"
        >
          <div className="p-2.5 rounded-full bg-slate-900/50 hover:bg-rose-500/20 transition">
            <Heart
              size={20}
              className={`transition-all duration-300 group-active:scale-125 ${
                hasLiked ? "fill-rose-500 stroke-rose-500 text-rose-500" : "text-white"
              }`}
            />
          </div>
          <span className="text-[10px] font-bold">{reel.likes?.length || 0}</span>
        </button>

        {/* Comments Button */}
        <button
          onClick={() => onCommentClick(reel)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="p-2.5 rounded-full bg-slate-900/50 hover:bg-violet-500/20 transition">
            <MessageCircle size={20} className="text-white" />
          </div>
          <span className="text-[10px] font-bold">{reel.comments?.length || 0}</span>
        </button>

        {/* Tagged Product Card Link */}
        {reel.product && (
          <button
            onClick={() => onProductClick(reel)}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-2.5 rounded-full bg-violet-600 hover:bg-violet-700 border border-violet-400 animate-bounce transition-all shadow-md">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <span className="text-[9px] font-extrabold uppercase text-violet-400 tracking-wider">Buy Item</span>
          </button>
        )}
      </div>

      {/* Bottom Description Overlay */}
      <div className="absolute left-4 right-16 bottom-6 z-20 text-left bg-gradient-to-t from-black/80 to-transparent p-4 rounded-xl max-w-[80%] pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto flex-wrap mb-1">
          <h3
            onClick={(e) => {
              e.stopPropagation();
              onProfileClick(reel.seller?._id || reel.seller);
            }}
            className="text-sm font-bold text-white hover:underline cursor-pointer flex items-center gap-1.5"
          >
            @{reel.seller?.name || "seller"}
            {reel.seller?.role === "seller" && (
              <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-md">PRO</span>
            )}
          </h3>

          {/* Follow/Following Button */}
          {currentUser && (reel.seller?._id || reel.seller) !== (currentUser?._id || currentUser?.id) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFollow(reel.seller?._id || reel.seller);
              }}
              className={`text-[9.5px] font-extrabold px-3 py-0.5 rounded-full transition active:scale-95 duration-150 ${
                isFollowing
                  ? "bg-white/20 text-white border border-white/25 hover:bg-white/35"
                  : "bg-violet-600 text-white hover:bg-violet-700"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
        <p className="text-xs text-slate-200 font-medium line-clamp-2">{reel.caption}</p>
      </div>
    </div>
  );
};

const ReelsSection = () => {
  const user = useSelector((store) => store.authReducer.user);
  const [reels, setReels] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  
  // Comments modal state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeReelForComments, setActiveReelForComments] = useState(null);
  const [commentText, setCommentText] = useState("");
  
  // Tagged product modal state
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [activeReelForProduct, setActiveReelForProduct] = useState(null);
  
  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const [caption, setCaption] = useState("");
  const [taggedProduct, setTaggedProduct] = useState("");
  const [myProducts, setMyProducts] = useState([]);

  // User details modal state
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Follow states
  const [followedSellers, setFollowedSellers] = useState(new Set());

  useEffect(() => {
    if (user) {
      setFollowedSellers(new Set(user.following || []));
    }
  }, [user]);

  // Fetch reels from socket
  useEffect(() => {
    socket.emit("getReels");

    const handleReelsList = (list) => {
      setReels(list);
    };

    const handleReelUpdated = (updatedReel) => {
      setReels((prev) =>
        prev.map((r) => (r._id === updatedReel._id ? updatedReel : r))
      );
      setActiveReelForComments((prev) =>
        prev && prev._id === updatedReel._id ? updatedReel : prev
      );
    };

    const handleFollowStatus = ({ targetUserId, isFollowing }) => {
      setFollowedSellers((prev) => {
        const next = new Set(prev);
        if (isFollowing) {
          next.add(targetUserId);
        } else {
          next.delete(targetUserId);
        }
        return next;
      });
    };

    socket.on("reelsList", handleReelsList);
    socket.on("reelUpdated", handleReelUpdated);
    socket.on("followStatusUpdated", handleFollowStatus);

    return () => {
      socket.off("reelsList", handleReelsList);
      socket.off("reelUpdated", handleReelUpdated);
      socket.off("followStatusUpdated", handleFollowStatus);
    };
  }, []);

  // Fetch my products when upload modal is opened
  useEffect(() => {
    if (isUploadOpen && user?._id) {
      socket.emit("getSellerProducts", { sellerId: user._id });
      const handleSellerProducts = (products) => {
        setMyProducts(products);
      };
      socket.on("sellerProducts", handleSellerProducts);
      return () => {
        socket.off("sellerProducts", handleSellerProducts);
      };
    }
  }, [isUploadOpen, user?._id]);

  const handleLike = (reelId) => {
    socket.emit("likeReel", { reelId });
  };

  const handleToggleFollow = (sellerId) => {
    socket.emit("followUser", { targetUserId: sellerId });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeReelForComments) return;
    socket.emit("commentReel", {
      reelId: activeReelForComments._id,
      text: commentText.trim(),
    });
    setCommentText("");
  };

  // Video Upload to Cloudinary and Reel creation
  const handleUploadReel = async (e) => {
    e.preventDefault();
    if (!videoFile) return;

    const formData = new FormData();
    formData.append("file", videoFile);

    setUploadProgress("Uploading video to Cloudinary...");
    try {
      const res = await api.post("/auth/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      socket.emit("addReel", {
        videoUrl: res.data.url,
        caption,
        productId: taggedProduct || null,
      });

      setUploadProgress("");
      setVideoFile(null);
      setCaption("");
      setTaggedProduct("");
      setIsUploadOpen(false);
      alert("Spotlight uploaded successfully!");
    } catch (err) {
      console.error("Spotlight upload failed", err);
      setUploadProgress("Upload failed!");
    }
  };

  const handleBuyProduct = (product, sellerId) => {
    const confirmBuy = window.confirm(
      `Confirm Order:\n\nProduct: ${product.name}\nPrice: $${product.price.toFixed(2)}\n\nWould you like to place this order?`
    );

    if (confirmBuy) {
      socket.emit("createOrder", {
        sellerId,
        productId: product._id,
        quantity: 1,
      });
      alert(`Order placed successfully!`);
      setIsProductOpen(false);
    }
  };

  const handleScroll = (e) => {
    const container = e.target;
    const scrollPos = container.scrollTop;
    const height = container.clientHeight;
    const idx = Math.round(scrollPos / height);
    if (idx !== activeIdx && idx >= 0 && idx < reels.length) {
      setActiveIdx(idx);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white relative items-center justify-center overflow-hidden transition-colors duration-200">
      
      {/* ================================= */}
      {/* TOP HEADER CONTROLS */}
      {/* ================================= */}
      <div className="absolute top-4 left-6 z-10 flex items-center justify-between w-[90%] max-w-sm sm:max-w-none">
        <h2 className="text-base font-extrabold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent flex items-center gap-1.5 drop-shadow-md">
          <Play size={18} className="fill-violet-500 stroke-violet-500" />
          NexaSpotlight
        </h2>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-violet-600 hover:bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-lg transition active:scale-95"
        >
          <Plus size={14} />
          Upload Spotlight
        </button>
      </div>

      {/* ================================= */}
      {/* REELS VERTICAL VIEWER (SCROLL-SNAP) */}
      {/* ================================= */}
      {reels.length === 0 ? (
        <div className="text-center p-6 text-gray-400">
          <Play size={48} className="mx-auto mb-3 text-slate-700 animate-pulse" />
          <p className="font-bold text-sm">No Spotlights Uploaded</p>
          <p className="text-xs mt-1">Be the first to upload a short spotlight product showcase video!</p>
        </div>
      ) : (
        <div
          onScroll={handleScroll}
          className="w-full max-w-sm h-[85vh] sm:h-[80vh] bg-black rounded-3xl overflow-y-scroll snap-y snap-mandatory scrollbar-none border border-gray-200 dark:border-slate-850 relative shadow-2xl flex flex-col"
        >
          {reels.map((reel, idx) => (
            <ReelCard
              key={reel._id}
              reel={reel}
              isActive={idx === activeIdx}
              currentUser={user}
              onLike={handleLike}
              onCommentClick={(r) => {
                setActiveReelForComments(r);
                setIsCommentsOpen(true);
              }}
              onProductClick={(r) => {
                setActiveReelForProduct(r);
                setIsProductOpen(true);
              }}
              onProfileClick={setSelectedUserId}
              isFollowing={followedSellers.has(reel.seller?._id || reel.seller)}
              onToggleFollow={handleToggleFollow}
            />
          ))}
        </div>
      )}

      {/* ================================= */}
      {/* COMMENTS BOTTOM DRAWER */}
      {/* ================================= */}
      {isCommentsOpen && activeReelForComments && (
        <div className="absolute inset-0 bg-black/60 z-30 flex items-end justify-center">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 rounded-t-3xl p-5 flex flex-col h-[50%] text-gray-900 dark:text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold">Comments ({activeReelForComments.comments?.length || 0})</h3>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {activeReelForComments.comments?.length === 0 ? (
                <p className="text-center text-xs text-gray-450 dark:text-gray-500 py-6">No comments yet. Write one below!</p>
              ) : (
                activeReelForComments.comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-2.5 text-xs items-start">
                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center font-bold">
                      {comment.user?.avatar ? (
                        <img src={comment.user.avatar} alt={comment.user.name} className="h-full w-full object-cover" />
                      ) : (
                        comment.user?.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-700 dark:text-gray-300">@{comment.user?.name}</p>
                      <p className="text-gray-600 dark:text-slate-200 mt-0.5">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2 border-t border-gray-100 dark:border-slate-800 pt-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-xl bg-gray-100 dark:bg-slate-800 px-3.5 py-2 text-xs text-gray-800 dark:text-white outline-none focus:ring-1 focus:ring-violet-500 border border-transparent dark:border-transparent focus:border-violet-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition animate-pulse-subtle"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================= */}
      {/* TAGGED PRODUCT POPUP CARD */}
      {/* ================================= */}
      {isProductOpen && activeReelForProduct?.product && (
        <div className="absolute inset-0 bg-black/60 z-35 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 relative flex flex-col text-gray-900 dark:text-white">
            <button
              onClick={() => setIsProductOpen(false)}
              className="absolute top-3 right-3 p-1.5 bg-black/10 dark:bg-black/40 hover:bg-black/25 dark:hover:bg-black/60 text-gray-650 dark:text-white rounded-full transition z-10"
            >
              <X size={15} />
            </button>

            <div className="h-40 bg-gray-50 dark:bg-slate-950 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-850">
              <img
                src={activeReelForProduct.product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200"}
                alt={activeReelForProduct.product.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mt-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white line-clamp-1">{activeReelForProduct.product.name}</h3>
                  <span className="text-sm font-extrabold text-violet-655 dark:text-violet-400 shrink-0">
                    ${activeReelForProduct.product.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {activeReelForProduct.product.description || "No description provided."}
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    addToCart(activeReelForProduct.product, activeReelForProduct.seller?._id || activeReelForProduct.seller, activeReelForProduct.seller?.name || "Seller");
                    alert("Added to cart! Open cart via the header shop menu.");
                  }}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-205 py-2 text-xs font-bold transition hover:bg-gray-50 dark:hover:bg-slate-850"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => handleBuyProduct(activeReelForProduct.product, activeReelForProduct.seller?._id || activeReelForProduct.seller)}
                  className="flex-1 rounded-xl bg-violet-600 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================= */}
      {/* UPLOAD REEL MODAL */}
      {/* ================================= */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs text-slate-800 dark:text-white">
          <div className="relative w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <Upload size={16} className="text-violet-600" />
                Upload New Spotlight
              </h2>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-705 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadReel} className="mt-4 space-y-4 text-xs font-medium">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-slate-400">
                  Select Video File (Short/MP4)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  required
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-55/60 dark:bg-slate-950 px-3 py-2 text-gray-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-slate-400">
                  Caption / Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Check out our new leather bags! Premium quality."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-55/60 dark:bg-slate-950 px-3 py-2 text-gray-705 dark:text-slate-200 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-slate-400">
                  Tag Product for Direct Sale (Optional)
                </label>
                <select
                  value={taggedProduct}
                  onChange={(e) => setTaggedProduct(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-55/60 dark:bg-slate-950 px-3 py-2 text-gray-705 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">-- Select Product --</option>
                  {myProducts.map((prod) => (
                    <option key={prod._id} value={prod._id}>
                      {prod.name} (${prod.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {uploadProgress && (
                <p className="text-center font-bold text-violet-600 dark:text-violet-405 mt-2 animate-pulse">
                  {uploadProgress}
                </p>
              )}

              <button
                type="submit"
                disabled={!!uploadProgress}
                className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                Upload & Publish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User details profile modal */}
      {selectedUserId && (
        <UserProfileModal
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          userId={selectedUserId}
        />
      )}
    </div>
  );
};

export default ReelsSection;
