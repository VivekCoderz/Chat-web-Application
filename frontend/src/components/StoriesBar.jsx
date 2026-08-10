import { useState, useEffect } from "react";
import { Plus, Camera, X, Play, Trash2 } from "lucide-react";
import { socket } from "../socket/socket";
import { useSelector } from "react-redux";
import api from "../config";

const StoriesBar = () => {
  const currentUser = useSelector((store) => store.authReducer.user);
  const [stories, setStories] = useState([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null); // Story group active in viewer
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

    const duration = 5000; // 5 seconds per story
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
        // Exit viewer
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
        // Restart current story
        setProgress(0);
      }
    }
  };

  const handleAddStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await api.post("/auth/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      socket.emit("addStory", {
        mediaUrl: res.data.url,
        caption: "",
      });
      alert("Story posted successfully!");
    } catch (err) {
      console.error("Failed to upload story", err);
      alert("Story upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteStory = (storyId) => {
    if (window.confirm("Are you sure you want to delete this story?")) {
      socket.emit("deleteStory", { storyId });
      setActiveStoryGroup(null);
      setActiveStoryIdx(0);
      setProgress(0);
    }
  };

  const myStoriesGroup = storyGroups.find(
    (g) => (g.user._id || g.user) === currentUser?._id
  );
  
  const otherStoriesGroups = storyGroups.filter(
    (g) => (g.user._id || g.user) !== currentUser?._id
  );

  return (
    <div className="shrink-0 bg-transparent px-4 py-2 border-b border-gray-200 dark:border-slate-800/60 flex gap-3 overflow-x-auto items-center scrollbar-none transition-colors duration-200">
      
      {/* 1. MY STORY BUTTON */}
      <div className="flex flex-col items-center shrink-0">
        <div className="relative">
          {myStoriesGroup ? (
            <div
              onClick={() => {
                setActiveStoryGroup(myStoriesGroup);
                setActiveStoryIdx(0);
                setProgress(0);
              }}
              className="h-10 w-10 rounded-full border-2 border-pink-500 p-0.5 cursor-pointer hover:scale-105 transition"
            >
              <img
                src={myStoriesGroup.user?.avatar || "https://via.placeholder.com/150"}
                alt="My Story"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-extrabold relative text-xs">
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          
          <label className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-violet-600 border border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-violet-700 transition shadow-sm">
            {isUploading ? (
              <span className="text-[6px] font-bold">...</span>
            ) : (
              <Plus size={10} />
            )}
            <input
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={handleAddStory}
              className="hidden"
            />
          </label>
        </div>
        <span className="text-[9px] text-gray-500 mt-1 dark:text-slate-450 font-medium">My Story</span>
      </div>

      {/* 2. OTHER STORIES */}
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
          <div className="h-10 w-10 rounded-full border-2 border-pink-500 dark:border-pink-600 p-0.5">
            <img
              src={group.user?.avatar || "https://via.placeholder.com/150"}
              alt={group.user?.name}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <span className="text-[9px] text-gray-600 dark:text-slate-400 mt-1 font-medium truncate max-w-[50px]">
            {group.user?.name}
          </span>
        </div>
      ))}

      {/* ================================= */}
      {/* FULL SCREEN STORY VIEWER MODAL */}
      {/* ================================= */}
      {activeStoryGroup && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-xs text-white">
          <div className="relative w-full max-w-sm h-[80vh] bg-black rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl border border-slate-900 select-none">
            
            {/* Top Area: Progress bars & User profile */}
            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 space-y-3">
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
                      onClick={() =>
                        handleDeleteStory(activeStoryGroup.items[activeStoryIdx]._id)
                      }
                      className="p-1.5 rounded-full hover:bg-white/20 text-rose-400 transition"
                      title="Delete story"
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

              {/* Story Content */}
              <img
                src={activeStoryGroup.items[activeStoryIdx].mediaUrl}
                alt="Story content"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Bottom Caption Overlay */}
            {activeStoryGroup.items[activeStoryIdx].caption && (
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-center">
                <p className="text-xs font-bold leading-relaxed">
                  {activeStoryGroup.items[activeStoryIdx].caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesBar;
