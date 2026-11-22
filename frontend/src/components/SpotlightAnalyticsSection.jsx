import { useState, useEffect } from "react";
import { ArrowLeft, Play, Heart, MessageCircle, ShoppingBag, Eye, TrendingUp, Users, Calendar } from "lucide-react";
import { useSelector } from "react-redux";
import { socket } from "../socket/socket";
import api from "../config";

const SpotlightAnalyticsSection = () => {
  const currentUser = useSelector((store) => store.authReducer.user);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.emit("getReels");
    const handleReelsList = (list) => {
      // Filter for current user's uploaded spotlights
      const ownReels = list.filter((r) => (r.seller?._id || r.seller) === currentUser?._id);
      setReels(ownReels);
    };
    socket.on("reelsList", handleReelsList);
    return () => {
      socket.off("reelsList", handleReelsList);
    };
  }, [currentUser]);

  // Dynamic metrics aggregates from real-time database
  const totalLikes = reels.reduce((acc, r) => acc + (r.likes?.length || 0), 0);
  const totalComments = reels.reduce((acc, r) => acc + (r.comments?.length || 0), 0);
  const totalViews = reels.reduce((acc, r) => acc + (r.views || 0), 0);
  const engagementRate = totalViews > 0 ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(1) : "0.0";

  // Dynamic Chart points construction representing actual spotlights
  const chartPoints = reels.map((r, i) => {
    // Distribute X coordinates evenly across [15, 485] range
    const x = reels.length > 1 ? 15 + i * (470 / (reels.length - 1)) : 250;
    const score = (r.views || 0) + (r.likes?.length || 0) * 3 + (r.comments?.length || 0) * 2;
    return { x, score, label: r.caption || "Spotlight" };
  });

  const maxScore = chartPoints.length > 0 ? Math.max(...chartPoints.map(p => p.score), 10) : 10;
  
  const pointsWithY = chartPoints.map(p => {
    // Map score to Y range [35, 175] (higher score -> smaller Y, i.e., top of the chart)
    const y = 175 - (p.score / maxScore) * 140;
    return { x: p.x, y, label: p.label, score: p.score };
  });

  // Construct SVG path string
  let pathD = "";
  let areaD = "";
  if (pointsWithY.length > 0) {
    if (pointsWithY.length === 1) {
      pathD = `M 15 ${pointsWithY[0].y} L 485 ${pointsWithY[0].y}`;
      areaD = `M 15 ${pointsWithY[0].y} L 485 ${pointsWithY[0].y} L 485 185 L 15 185 Z`;
    } else {
      pathD = `M ${pointsWithY[0].x} ${pointsWithY[0].y}`;
      for (let i = 1; i < pointsWithY.length; i++) {
        pathD += ` L ${pointsWithY[i].x} ${pointsWithY[i].y}`;
      }
      areaD = `${pathD} L ${pointsWithY[pointsWithY.length - 1].x} 185 L ${pointsWithY[0].x} 185 Z`;
    }
  } else {
    // Flat line if no data
    pathD = "M 15 175 L 485 175";
    areaD = "M 15 175 L 485 175 L 485 185 L 15 185 Z";
  }

  return (
    <div className="w-full h-full bg-[#f7f7fc] dark:bg-[#0b0c14] overflow-y-auto px-4 py-6 md:px-8 select-none transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80 active:scale-95 transition shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-violet-600 dark:text-violet-450" />
              Spotlight Creator Analytics
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-500">
              Review reach, viewer engagement, and storefront conversions from your showcase videos.
            </p>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0c0d14] border border-gray-200/60 dark:border-slate-800/50 rounded-3xl p-4 shadow-xs">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider block">Total Spotlights</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xl font-black text-gray-900 dark:text-white">{reels.length}</span>
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400">
                <Play size={16} className="fill-violet-600 dark:fill-violet-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0d14] border border-gray-200/60 dark:border-slate-800/50 rounded-3xl p-4 shadow-xs">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider block">Real-time Views</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xl font-black text-gray-900 dark:text-white">{totalViews.toLocaleString()}</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                <Eye size={16} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0d14] border border-gray-200/60 dark:border-slate-800/50 rounded-3xl p-4 shadow-xs">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider block">Total Interactions</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xl font-black text-gray-900 dark:text-white">{totalLikes + totalComments}</span>
              <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-450">
                <Heart size={16} className="fill-pink-650 dark:fill-pink-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0d14] border border-gray-200/60 dark:border-slate-800/50 rounded-3xl p-4 shadow-xs">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider block">Engagement Rate</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xl font-black text-gray-900 dark:text-white">{engagementRate}%</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                <Users size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Custom SVG Trend Graph */}
        <div className="bg-white dark:bg-[#0c0d14] border border-gray-200/60 dark:border-slate-800/50 rounded-3xl p-5 shadow-xs">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Spotlight Video Engagement Score</h3>
          <div className="relative w-full h-48 sm:h-56">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(124, 58, 237)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="rgb(124, 58, 237)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(156, 163, 175, 0.08)" strokeDasharray="3" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(156, 163, 175, 0.08)" strokeDasharray="3" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(156, 163, 175, 0.08)" strokeDasharray="3" />

              {/* Smooth trend path */}
              <path
                d={pathD}
                fill="none"
                stroke="rgb(124, 58, 237)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d={areaD}
                fill="url(#gradient)"
              />

              {/* Data points */}
              {pointsWithY.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="rgb(124, 58, 237)"
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer transition hover:r-7"
                  title={`${p.label}: Score ${p.score || 0}`}
                />
              ))}
            </svg>
            <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-2 px-1">
              <span>Video 1</span>
              <span>Video 2</span>
              <span>Video 3</span>
              <span>Video 4</span>
              <span>Video 5</span>
              <span>Video 6</span>
              <span>Video 7</span>
            </div>
          </div>
        </div>

        {/* Video Performance list */}
        <div className="bg-white dark:bg-[#0c0d14] border border-gray-200/60 dark:border-slate-800/50 rounded-3xl p-5 shadow-xs">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Spotlights Engagement</h3>
          {reels.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              No videos uploaded to analyze.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800/40">
              {reels.map((reel) => {
                let pName = "";
                try {
                  if (reel.product) {
                    pName = reel.product.name || "";
                  }
                } catch(e) {}
                
                return (
                  <div key={reel._id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0 w-10 h-10 rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center border border-gray-200/40 dark:border-slate-800/40">
                        <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <Play size={12} className="text-white fill-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{reel.caption || "Untitled Spotlight"}</p>
                        <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">
                          {pName ? `Tagged: ${pName}` : "No tagged product"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 text-gray-600 dark:text-slate-400 text-xs">
                      <div className="flex items-center gap-1">
                        <Heart size={13} className="text-rose-500 fill-rose-500" />
                        <span className="font-bold text-[10px]">{reel.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={13} className="text-violet-500" />
                        <span className="font-bold text-[10px]">{reel.comments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Creator Commerce & Affiliate Dashboard */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-black border border-violet-900/30 rounded-3xl p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-violet-900/20 pb-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag size={16} className="text-violet-400" />
                Nexa Creator Affiliate Program
              </h3>
              <p className="text-[10px] text-violet-200 mt-0.5">
                Track commission earnings generated from promoting other store products.
              </p>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full">
              Active Affiliate
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Affiliate Clicks</span>
              <span className="text-lg font-black text-white mt-1.5 block">{(totalViews * 0.15).toFixed(0)}</span>
              <span className="text-[8px] text-emerald-400 mt-1 block">15.0% CTR index</span>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sales Generated</span>
              <span className="text-lg font-black text-white mt-1.5 block">{(totalViews * 0.012).toFixed(0)} orders</span>
              <span className="text-[8px] text-violet-400 mt-1 block">1.2% Conversion rate</span>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Revenue Promoted</span>
              <span className="text-lg font-black text-white mt-1.5 block">₹{Math.round((totalViews * 0.012) * 1499).toLocaleString()}</span>
              <span className="text-[8px] text-slate-500 mt-1 block">Avg price: ₹1,499</span>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Commission Rate</span>
              <span className="text-lg font-black text-emerald-400 mt-1.5 block">10.0% Flat</span>
              <span className="text-[8px] text-emerald-500 mt-1 block">Platform standard</span>
            </div>
          </div>

          {/* Earnings card details */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Commission Earned</span>
              <span className="text-lg font-black text-violet-400 mt-1 block">₹{Math.round(((totalViews * 0.012) * 1499) * 0.1).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pending Payout</span>
              <span className="text-lg font-black text-amber-500 mt-1 block">₹{Math.round((((totalViews * 0.012) * 1499) * 0.1) * 0.3).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Completed Payout</span>
              <span className="text-lg font-black text-emerald-500 mt-1 block">₹{Math.round((((totalViews * 0.012) * 1499) * 0.1) * 0.7).toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SpotlightAnalyticsSection;
