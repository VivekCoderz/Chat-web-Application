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
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import api from "../config";
import { loadUserSuccess } from "../Redux/feature/authSlice";
import { socket } from "../socket/socket";

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

const UserProfileModal = ({
  isOpen,
  onClose,
  userId,
  isPage = false,
}) => {
  const dispatch = useDispatch();

  const currentUser = useSelector(
    (store) => store.authReducer.user
  );

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

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

  // Followers / Following
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const currentUserId = currentUser?._id || currentUser?.id;

  const isCurrentUser =
    currentUserId && userId
      ? String(currentUserId) === String(userId)
      : false;

  const shouldShow = isPage || isOpen;

  // --------------------------------------------------
  // Initialize form
  // --------------------------------------------------

  const initForm = (u) => {
    if (!u) return;

    setName(u.name || "");
    setRole(u.role || "user");
    setBio(u.bio || "");

    setWhatsappAbout(
      u.whatsappAbout || "Hey there! I am using NexaChat."
    );

    setShopName(u.shopName || "");
    setInstagramLink(u.instagramLink || "");
    setWhatsappLink(u.whatsappLink || "");

    setAvatar(u.avatar || "");
    setShopImage(u.shopImage || "");

    // Followers
    setFollowersCount(u.followers?.length || 0);

    // Following
    setFollowingCount(u.following?.length || 0);

    // Check following status
    const following = u.followers?.some((follower) => {
      const followerId =
        follower?._id || follower?.id || follower;

      return (
        followerId &&
        currentUserId &&
        String(followerId) === String(currentUserId)
      );
    });

    setIsFollowing(Boolean(following));
  };

  // --------------------------------------------------
  // Fetch User
  // --------------------------------------------------

  useEffect(() => {
    if (!shouldShow || !userId) return;

    const fetchUser = async () => {
      setLoading(true);

      try {
        // Current logged-in user
        if (isCurrentUser) {
          setUser(currentUser);
          initForm(currentUser);
        } else {
          // Other user's profile
          const res = await api.get(`/auth/user/${userId}`);

          const fetchedUser = res.data.user;

          setUser(fetchedUser);
          initForm(fetchedUser);
        }
      } catch (error) {
        console.error(
          "Error fetching user profile:",
          error
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [
    shouldShow,
    userId,
    currentUserId,
  ]);

  // --------------------------------------------------
  // Socket Follow Updates
  // --------------------------------------------------

  useEffect(() => {
    if (!shouldShow || !userId) return;

    const handleFollowStatusUpdated = ({
      targetUserId,
      isFollowing: status,
      followersCount: fCount,
      followingCount: folCount,
    }) => {
      if (
        String(targetUserId) === String(userId)
      ) {
        setIsFollowing(Boolean(status));

        if (typeof fCount === "number") {
          setFollowersCount(fCount);
        }

        if (typeof folCount === "number") {
          setFollowingCount(folCount);
        }
      }
    };

    const handleUserFollowersUpdated = ({
      userId: updatedUserId,
      followersCount: fCount,
    }) => {
      if (
        String(updatedUserId) === String(userId)
      ) {
        setFollowersCount(fCount);
      }
    };

    socket.on(
      "followStatusUpdated",
      handleFollowStatusUpdated
    );

    socket.on(
      "userFollowersUpdated",
      handleUserFollowersUpdated
    );

    return () => {
      socket.off(
        "followStatusUpdated",
        handleFollowStatusUpdated
      );

      socket.off(
        "userFollowersUpdated",
        handleUserFollowersUpdated
      );
    };
  }, [shouldShow, userId]);

  // --------------------------------------------------
  // Follow / Unfollow
  // --------------------------------------------------

  const handleToggleFollow = () => {
    if (!userId || isCurrentUser) return;

    socket.emit("followUser", {
      targetUserId: userId,
    });
  };

  // --------------------------------------------------
  // File Upload
  // --------------------------------------------------

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    setUploadProgress(`Uploading ${type}...`);

    try {
      const res = await api.post(
        "/auth/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (type === "avatar") {
        setAvatar(res.data.url);
      }

      if (type === "shopImage") {
        setShopImage(res.data.url);
      }

      setUploadProgress("");
    } catch (error) {
      console.error(
        "Upload failed:",
        error
      );

      setUploadProgress("Upload failed!");

      setTimeout(() => {
        setUploadProgress("");
      }, 2000);
    }
  };

  // --------------------------------------------------
  // Save Profile
  // --------------------------------------------------

  const handleSave = async () => {
    setLoading(true);

    try {
      const res = await api.put(
        "/auth/profile",
        {
          name,
          role,
          bio,
          whatsappAbout,
          shopName,
          shopImage,
          avatar,
          instagramLink,
          whatsappLink,
        }
      );

      const updatedUser = res.data.user;

      // Redux update
      dispatch(
        loadUserSuccess(updatedUser)
      );

      // Local state update
      setUser(updatedUser);

      // Update form
      initForm(updatedUser);

      setIsEditing(false);

      // Refresh online users
      socket.emit("getOnlineUsers");
    } catch (error) {
      console.error(
        "Update profile failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Close modal
  // --------------------------------------------------

  const handleClose = () => {
    setIsEditing(false);
    setUploadProgress("");

    if (onClose) {
      onClose();
    }
  };

  // --------------------------------------------------
  // Don't render when closed
  // --------------------------------------------------

  if (!shouldShow || !userId) {
    return null;
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading && !user) {
    if (isPage) {
      return (
        <div className="w-full flex items-center justify-center py-20">
          <div className="text-sm font-semibold text-gray-500 dark:text-slate-400">
            Loading Profile...
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-[#0c0d14] rounded-2xl px-8 py-6 shadow-xl">
          <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">
            Loading Profile...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // --------------------------------------------------
  // Profile Content
  // --------------------------------------------------

  const renderContent = () => {
    return (
      <div
        className={`relative w-full border border-gray-200 bg-white shadow-md
        dark:border-slate-800/60 dark:bg-[#0c0d14]
        overflow-hidden flex flex-col transition-all duration-200
        ${
          isPage
            ? "max-w-2xl rounded-3xl"
            : "max-w-md rounded-3xl max-h-[90vh]"
        }`}
      >
        {/* =========================================
            HEADER
        ========================================= */}

        <div
          className={`relative bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-800 shrink-0
          ${
            isPage
              ? "h-36 sm:h-44"
              : "h-28"
          }`}
        >
          {/* Shop Banner */}

          {role === "seller" &&
            (shopImage || user.shopImage) && (
              <img
                src={
                  isEditing
                    ? shopImage
                    : user.shopImage
                }
                alt="Shop Banner"
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              />
            )}

          {/* Change Cover */}

          {isCurrentUser &&
            isEditing &&
            role === "seller" && (
              <label
                className="absolute bottom-2 right-2
                flex items-center gap-1
                bg-black/50 hover:bg-black/70
                text-white text-[10px] font-bold
                px-2.5 py-1.5 rounded-full
                cursor-pointer transition shadow-sm"
              >
                <Camera size={12} />

                Change Cover

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileUpload(
                      e,
                      "shopImage"
                    )
                  }
                  className="hidden"
                />
              </label>
            )}

          {/* Back / Close */}

          {isPage ? (
            <button
              onClick={() =>
                window.history.back()
              }
              className="absolute top-3 left-3
              rounded-full bg-black/35
              hover:bg-black/50
              p-2 px-3 text-white
              transition z-10
              flex items-center gap-1
              text-[10.5px] font-bold"
            >
              <ArrowLeft size={13} />

              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="absolute top-3 right-3
              rounded-full bg-black/30
              hover:bg-black/50
              p-2 text-white transition z-10"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* =========================================
            PROFILE BASIC INFO
        ========================================= */}

        <div
          className="px-5 pb-4 relative flex flex-col
          items-center -mt-10 shrink-0
          border-b border-gray-200/70
          dark:border-slate-800/50
          bg-white dark:bg-[#0c0d14]"
        >
          {/* Avatar */}

          <div
            className="relative h-20 w-20
            rounded-full border-4
            border-white dark:border-[#0c0d14]
            bg-violet-100 dark:bg-violet-900/40
            text-violet-700 dark:text-violet-400
            overflow-hidden shadow-sm
            flex items-center justify-center"
          >
            {(
              isEditing
                ? avatar
                : user.avatar
            ) ? (
              <img
                src={
                  isEditing
                    ? avatar
                    : user.avatar
                }
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-extrabold">
                {user.name
                  ?.charAt(0)
                  .toUpperCase()}
              </span>
            )}

            {/* Change Avatar */}

            {isCurrentUser &&
              isEditing && (
                <label
                  className="absolute inset-0
                  flex items-center justify-center
                  bg-black/50 text-white
                  cursor-pointer opacity-0
                  hover:opacity-100
                  transition duration-200"
                >
                  <Camera size={18} />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileUpload(
                        e,
                        "avatar"
                      )
                    }
                    className="hidden"
                  />
                </label>
              )}
          </div>

          {/* Name */}

          <div className="mt-2 text-center w-full">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="border-b border-violet-300
                  dark:border-slate-700
                  bg-transparent
                  text-gray-900 dark:text-white
                  text-base font-bold
                  text-center
                  focus:outline-none
                  focus:border-violet-500
                  w-44"
                />
              ) : (
                <h2
                  className="text-base font-bold
                  text-gray-900 dark:text-white"
                >
                  {user.name}
                </h2>
              )}

              {user.role === "seller" && (
                <span
                  className="text-[9px]
                  bg-amber-50
                  text-amber-700
                  dark:bg-amber-950/40
                  dark:text-amber-400
                  border border-amber-200/50
                  dark:border-amber-900/30
                  font-bold px-2 py-0.5
                  rounded-full uppercase
                  tracking-wider"
                >
                  Seller
                </span>
              )}
            </div>

            <p
              className="text-[11px]
              text-gray-400
              dark:text-slate-500
              font-medium mt-0.5"
            >
              {user.email}
            </p>
          </div>

          {/* Followers */}

          <div
            className="flex gap-4 mt-3
            bg-[#f7f7fc]/80
            dark:bg-[#131522]/45
            px-5 py-1.5 rounded-full
            border border-gray-200/40
            dark:border-slate-800/30"
          >
            <div className="text-center">
              <span
                className="text-xs font-bold
                text-gray-800
                dark:text-slate-200"
              >
                {followersCount}
              </span>

              <span
                className="text-[10px]
                text-gray-400 ml-1
                font-medium"
              >
                followers
              </span>
            </div>

            <div
              className="w-px h-3.5
              bg-gray-200
              dark:bg-slate-800
              self-center"
            />

            <div className="text-center">
              <span
                className="text-xs font-bold
                text-gray-800
                dark:text-slate-200"
              >
                {followingCount}
              </span>

              <span
                className="text-[10px]
                text-gray-400 ml-1
                font-medium"
              >
                following
              </span>
            </div>
          </div>

          {/* Action Buttons */}

          <div className="mt-3.5 flex justify-center w-full">
            {/* Other user */}

            {!isCurrentUser && (
              <button
                onClick={handleToggleFollow}
                className={`rounded-xl px-6 py-2
                text-xs font-bold
                shadow-sm transition
                active:scale-95 duration-150
                ${
                  isFollowing
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
                    : "bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/10"
                }`}
              >
                {isFollowing
                  ? "Following"
                  : "Follow Shop"}
              </button>
            )}

            {/* Current user */}

            {isCurrentUser && (
              <div
                className="w-full flex gap-2
                justify-center max-w-[240px]"
              >
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 flex
                    items-center justify-center
                    gap-1.5 rounded-xl
                    bg-violet-600
                    hover:bg-violet-700
                    text-white py-2
                    text-xs font-bold
                    shadow-sm transition
                    disabled:opacity-50"
                  >
                    <Save size={13} />

                    <span>
                      {loading
                        ? "Saving..."
                        : "Save Profile"}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setIsEditing(true)
                    }
                    className="flex-1 flex
                    items-center justify-center
                    gap-1.5 rounded-xl
                    border border-gray-200
                    dark:border-slate-800
                    bg-[#f7f7fc]/50
                    hover:bg-[#eef2fe]/30
                    text-gray-600
                    dark:text-slate-300
                    dark:hover:bg-slate-800/50
                    py-2 text-xs font-bold
                    transition shadow-sm"
                  >
                    <Edit size={13} />

                    <span>
                      Edit Profile
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upload Status */}

        {uploadProgress && (
          <div
            className="mx-6 text-center
            text-xs font-semibold
            text-violet-600
            dark:text-violet-400
            shrink-0 mt-2"
          >
            {uploadProgress}
          </div>
        )}

        {/* =========================================
            SCROLLABLE BODY
        ========================================= */}

        <div
          className="flex-1 overflow-y-auto
          px-5 py-4 space-y-4
          bg-gray-50/50
          dark:bg-[#08090f]/30"
        >
          {/* =========================================
              ACCOUNT SETTINGS
          ========================================= */}

          {isCurrentUser &&
            isEditing && (
              <div
                className="bg-white
                dark:bg-[#131522]
                rounded-2xl p-4
                border border-gray-200/70
                dark:border-slate-800/60
                shadow-sm space-y-3"
              >
                <h3
                  className="text-[10px]
                  font-bold text-gray-400
                  dark:text-slate-500
                  uppercase tracking-wider
                  flex items-center gap-1.5"
                >
                  <Shield size={13} />

                  Account Settings
                </h3>

                <div
                  className="flex items-center
                  justify-between gap-3"
                >
                  <div>
                    <p
                      className="text-xs font-bold
                      text-gray-700
                      dark:text-slate-300"
                    >
                      Account Type
                    </p>

                    <p
                      className="text-[9px]
                      text-gray-400 mt-0.5"
                    >
                      Switch to Seller to post
                      Reels and Shop
                    </p>
                  </div>

                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value)
                    }
                    className="rounded-xl
                    border border-gray-200
                    dark:border-slate-800
                    bg-white
                    dark:bg-slate-900
                    text-xs font-semibold
                    text-gray-700
                    dark:text-slate-300
                    px-3 py-1.5
                    outline-none"
                  >
                    <option value="user">
                      Member (Buyer)
                    </option>

                    <option value="seller">
                      Seller (Business)
                    </option>
                  </select>
                </div>

                {/* Shop Name */}

                {role === "seller" && (
                  <div
                    className="space-y-1.5 pt-2
                    border-t border-gray-200/60
                    dark:border-slate-800/40"
                  >
                    <label
                      className="text-xs font-bold
                      text-gray-700
                      dark:text-slate-300"
                    >
                      Shop Name
                    </label>

                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) =>
                        setShopName(
                          e.target.value
                        )
                      }
                      placeholder="e.g. My Craft Shop"
                      className="w-full
                      rounded-xl
                      border border-gray-200
                      dark:border-slate-800
                      bg-white
                      dark:bg-slate-900
                      text-xs
                      text-gray-700
                      dark:text-slate-300
                      px-3 py-2 outline-none
                      focus:border-violet-500
                      focus:ring-1
                      focus:ring-violet-500/10"
                    />
                  </div>
                )}
              </div>
            )}

          {/* =========================================
              WHATSAPP STATUS
          ========================================= */}

          <div
            className="bg-white
            dark:bg-[#131522]
            rounded-2xl p-4
            border border-gray-200/70
            dark:border-slate-800/60
            shadow-sm space-y-2"
          >
            <h3
              className="text-[10px]
              font-bold text-gray-400
              dark:text-slate-500
              uppercase tracking-wider
              flex items-center gap-1"
            >
              <Info
                size={13}
                className="text-violet-500"
              />

              WhatsApp Status
            </h3>

            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={whatsappAbout}
                  onChange={(e) =>
                    setWhatsappAbout(
                      e.target.value
                    )
                  }
                  placeholder="Set custom WhatsApp status..."
                  className="w-full
                  rounded-xl
                  border border-gray-200
                  dark:border-slate-800
                  bg-white
                  dark:bg-slate-900
                  text-xs
                  text-gray-700
                  dark:text-slate-300
                  px-3 py-2 outline-none
                  focus:border-violet-500
                  focus:ring-1
                  focus:ring-violet-500/10"
                />

                <div className="flex flex-wrap gap-1">
                  {PRESET_ABOUTS.slice(
                    0,
                    7
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setWhatsappAbout(
                          preset
                        )
                      }
                      className={`text-[9px]
                      px-2.5 py-1
                      rounded-full border
                      transition
                      ${
                        whatsappAbout ===
                        preset
                          ? "bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-950/20 dark:border-violet-800 dark:text-violet-300"
                          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p
                className="text-xs font-semibold
                text-gray-800
                dark:text-slate-200
                leading-relaxed
                bg-[#f7f7fc]/50
                dark:bg-[#0c0d14]/40
                p-2.5 rounded-xl
                border border-gray-200/30
                dark:border-slate-800/20"
              >
                "
                {user.whatsappAbout ||
                  "Hey there! I am using NexaChat."}
                "
              </p>
            )}
          </div>

          {/* =========================================
              BIO
          ========================================= */}

          <div
            className="bg-white
            dark:bg-[#131522]
            rounded-2xl p-4
            border border-gray-200/70
            dark:border-slate-800/60
            shadow-sm space-y-2"
          >
            <h3
              className="text-[10px]
              font-bold text-gray-400
              dark:text-slate-500
              uppercase tracking-wider
              flex items-center gap-1"
            >
              <User
                size={13}
                className="text-violet-500"
              />

              User Bio
            </h3>

            {isEditing ? (
              <textarea
                rows={3}
                value={bio}
                onChange={(e) =>
                  setBio(e.target.value)
                }
                placeholder="Tell us about yourself..."
                className="w-full
                rounded-xl
                border border-gray-200
                dark:border-slate-800
                bg-white
                dark:bg-slate-900
                text-xs
                text-gray-700
                dark:text-slate-300
                p-3 outline-none
                focus:border-violet-500
                focus:ring-1
                focus:ring-violet-500/10
                resize-none"
              />
            ) : (
              <p
                className="text-xs
                text-gray-600
                dark:text-slate-300
                leading-relaxed
                whitespace-pre-line"
              >
                {user.bio ? (
                  user.bio
                    .split(" ")
                    .map((word, index) => {
                      if (
                        word.startsWith("#") ||
                        word.startsWith("@")
                      ) {
                        return (
                          <span
                            key={index}
                            className="text-violet-600
                            dark:text-violet-400
                            font-bold
                            hover:underline
                            cursor-pointer"
                          >
                            {word}{" "}
                          </span>
                        );
                      }

                      return (
                        <span key={index}>
                          {word}{" "}
                        </span>
                      );
                    })
                ) : (
                  <span
                    className="text-gray-400
                    dark:text-slate-600 italic"
                  >
                    No bio written yet.
                  </span>
                )}
              </p>
            )}
          </div>

          {/* =========================================
              SELLER SHOP
          ========================================= */}

          {!isEditing &&
            user.role === "seller" && (
              <div
                className="bg-gradient-to-br
                from-violet-500/5
                to-indigo-500/5
                dark:from-violet-950/10
                dark:to-indigo-950/10
                rounded-2xl p-4
                border border-violet-100
                dark:border-violet-900/10
                space-y-2 shadow-sm"
              >
                <h4
                  className="text-[10px]
                  font-bold
                  text-violet-700
                  dark:text-violet-400
                  uppercase tracking-wider
                  flex items-center gap-1"
                >
                  <Store size={13} />

                  Seller Shop
                </h4>

                <p
                  className="text-xs font-bold
                  text-gray-800
                  dark:text-slate-200"
                >
                  Shop Name:{" "}
                  <span
                    className="font-semibold
                    text-violet-600
                    dark:text-violet-300"
                  >
                    {user.shopName ||
                      `${user.name}'s Shop`}
                  </span>
                </p>

                <p
                  className="text-[11px]
                  text-gray-500
                  dark:text-slate-400
                  font-medium"
                >
                  Products are active in
                  their catalog! Tap the Shop
                  icon in private chats to browse.
                </p>
              </div>
            )}

          {/* =========================================
              SOCIAL LINKS
          ========================================= */}

          <div
            className="bg-white
            dark:bg-[#131522]
            rounded-2xl p-4
            border border-gray-200/70
            dark:border-slate-800/60
            shadow-sm space-y-3"
          >
            <h3
              className="text-[10px]
              font-bold text-gray-400
              dark:text-slate-500
              uppercase tracking-wider"
            >
              Social Links & Contact
            </h3>

            <div className="space-y-2">
              {/* Instagram */}

              <div
                className="flex items-center gap-3"
              >
                <Globe
                  className="text-pink-500 shrink-0"
                  size={15}
                />

                {isEditing ? (
                  <input
                    type="url"
                    value={instagramLink}
                    onChange={(e) =>
                      setInstagramLink(
                        e.target.value
                      )
                    }
                    placeholder="https://instagram.com/username"
                    className="flex-1
                    rounded-xl
                    border border-gray-200
                    dark:border-slate-800
                    bg-white
                    dark:bg-slate-900
                    text-xs
                    text-gray-700
                    dark:text-slate-300
                    px-3 py-1.5
                    outline-none
                    focus:border-violet-500"
                  />
                ) : user.instagramLink ? (
                  <a
                    href={user.instagramLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs
                    text-violet-600
                    dark:text-violet-400
                    hover:underline
                    font-bold"
                  >
                    Instagram Profile
                  </a>
                ) : (
                  <span
                    className="text-xs
                    text-gray-400
                    dark:text-slate-600"
                  >
                    Not linked
                  </span>
                )}
              </div>

              {/* WhatsApp */}

              <div
                className="flex items-center gap-3"
              >
                <PhoneCall
                  className="text-emerald-500 shrink-0"
                  size={15}
                />

                {isEditing ? (
                  <input
                    type="url"
                    value={whatsappLink}
                    onChange={(e) =>
                      setWhatsappLink(
                        e.target.value
                      )
                    }
                    placeholder="https://wa.me/phone_number"
                    className="flex-1
                    rounded-xl
                    border border-gray-200
                    dark:border-slate-800
                    bg-white
                    dark:bg-slate-900
                    text-xs
                    text-gray-700
                    dark:text-slate-300
                    px-3 py-1.5
                    outline-none
                    focus:border-violet-500"
                  />
                ) : user.whatsappLink ? (
                  <a
                    href={user.whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs
                    text-emerald-600
                    dark:text-emerald-400
                    hover:underline
                    font-bold"
                  >
                    WhatsApp Chat / Channel
                  </a>
                ) : (
                  <span
                    className="text-xs
                    text-gray-400
                    dark:text-slate-600"
                  >
                    Not linked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------
  // PAGE MODE
  // --------------------------------------------------

  if (isPage) {
    return renderContent();
  }

  // --------------------------------------------------
  // MODAL MODE
  // --------------------------------------------------

  return (
    <div
      className="fixed inset-0 z-50
      flex items-center justify-center
      bg-black/40 backdrop-blur-sm p-4"
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