import { useEffect, useState } from "react";
import { Plus, Trash2, ShoppingBag, DollarSign, Package, ClipboardList, Check, X, CheckSquare } from "lucide-react";
import { socket } from "../socket/socket";
import { useDispatch, useSelector } from "react-redux";
import { setSellerProducts, setSellerOrders, setBuyerOrders } from "../Redux/feature/generalChatSlice";
import api from "../config";

const ShopDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((store) => store.authReducer.user);
  const sellerProducts = useSelector((store) => store.generalCharReducer.sellerProducts);
  const sellerOrders = useSelector((store) => store.generalCharReducer.sellerOrders);
  const buyerOrders = useSelector((store) => store.generalCharReducer.buyerOrders);

  const [activeTab, setActiveTab] = useState("sell"); // 'sell' | 'received_orders' | 'my_purchases' | 'analytics'

  // Review states
  const [selectedProductForReview, setSelectedProductForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Add product form state
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);

  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    if (!currentUserId) return;

    // Load initial data
    socket.emit("getSellerProducts", { sellerId: currentUserId });
    socket.emit("getSellerOrders");
    socket.emit("getBuyerOrders");

    const handleSellerProducts = (products) => {
      dispatch(setSellerProducts(products));
    };

    const handleSellerOrders = (orders) => {
      dispatch(setSellerOrders(orders));
    };

    const handleBuyerOrders = (orders) => {
      dispatch(setBuyerOrders(orders));
    };

    const handleNewOrderAlert = () => {
      socket.emit("getSellerOrders");
    };

    const handleOrderStatusUpdated = () => {
      socket.emit("getBuyerOrders");
    };

    socket.on("sellerProducts", handleSellerProducts);
    socket.on("sellerOrdersList", handleSellerOrders);
    socket.on("buyerOrdersList", handleBuyerOrders);
    socket.on("newOrderAlert", handleNewOrderAlert);
    socket.on("orderStatusUpdated", handleOrderStatusUpdated);

    return () => {
      socket.off("sellerProducts", handleSellerProducts);
      socket.off("sellerOrdersList", handleSellerOrders);
      socket.off("buyerOrdersList", handleBuyerOrders);
      socket.off("newOrderAlert", handleNewOrderAlert);
      socket.off("orderStatusUpdated", handleOrderStatusUpdated);
    };
  }, [currentUserId, dispatch]);

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice.trim()) return;

    socket.emit("addProduct", {
      name: prodName.trim(),
      description: prodDesc.trim(),
      price: parseFloat(prodPrice),
      image: prodImage.trim() || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200",
    });

    setProdName("");
    setProdPrice("");
    setProdDesc("");
    setProdImage("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingImg(true);
    try {
      const res = await api.post("/auth/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProdImage(res.data.url);
    } catch (err) {
      console.error("Product image upload failed", err);
      alert("Failed to upload image.");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      socket.emit("deleteProduct", { productId });
    }
  };

  const handleUpdateStatus = (orderId, status) => {
    socket.emit("updateOrderStatus", { orderId, status });
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-slate-50/50 dark:bg-slate-950 overflow-y-auto transition-colors duration-200">
      {/* Title Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0 dark:bg-slate-900 dark:border-slate-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingBag className="text-violet-600 dark:text-violet-400" size={24} />
          E-commerce Shop Manager
        </h1>
        <p className="text-xs text-gray-500 mt-1 dark:text-slate-400">
          WhatsApp Business E-commerce panel. Sell products, manage orders and track your spending.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-4 shrink-0 dark:bg-slate-900 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("sell")}
          className={`py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "sell"
              ? "border-violet-600 text-violet-600 dark:border-violet-500 dark:text-violet-450"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          My Catalog (Sell)
        </button>
        <button
          onClick={() => setActiveTab("received_orders")}
          className={`py-3 text-sm font-semibold border-b-2 transition relative ${
            activeTab === "received_orders"
              ? "border-violet-600 text-violet-600 dark:border-violet-500 dark:text-violet-450"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Orders Received
          {sellerOrders.filter((o) => o.status === "pending").length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
              {sellerOrders.filter((o) => o.status === "pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("my_purchases")}
          className={`py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "my_purchases"
              ? "border-violet-600 text-violet-600 dark:border-violet-500 dark:text-violet-450"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          My Purchases (Buy)
        </button>
        {user?.role === "seller" && (
          <button
            onClick={() => setActiveTab("analytics")}
            className={`py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "analytics"
                ? "border-violet-600 text-violet-600 dark:border-violet-500 dark:text-violet-450"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Business Analytics
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "sell" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs h-fit">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
                <Plus size={16} className="text-violet-600 dark:text-violet-400" />
                Add Product to Shop
              </h2>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vintage Leather Bag"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-850 bg-gray-50 dark:bg-slate-950 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 outline-none transition focus:border-violet-400 dark:focus:border-violet-900 dark:focus:bg-slate-950 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Price ($)</label>
                  <div className="relative mt-1 flex items-center">
                    <DollarSign size={14} className="absolute left-3 text-gray-400 dark:text-slate-500" />
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="99.99"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-850 bg-gray-50 dark:bg-slate-950 pl-8 pr-3 py-2 text-sm text-gray-700 dark:text-slate-200 outline-none transition focus:border-violet-400 dark:focus:border-violet-900 dark:focus:bg-slate-950 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Product Image</label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="cursor-pointer flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-slate-350 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    >
                      <Plus size={14} />
                      {uploadingImg ? "Uploading..." : "Upload Image"}
                    </label>
                    {prodImage && (
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800 shrink-0">
                        <img src={prodImage} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your product specs, colors, sizes..."
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-850 bg-gray-50 dark:bg-slate-950 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 outline-none transition focus:border-violet-400 dark:focus:border-violet-900 dark:focus:bg-slate-950 focus:bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 dark:hover:bg-violet-750"
                >
                  List Product
                </button>
              </form>
            </div>

            {/* Catalog List Column */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">My Listed Catalog ({sellerProducts.length})</h2>

              {sellerProducts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 text-center text-gray-400 dark:text-slate-500">
                  <Package size={36} className="mx-auto text-gray-300 dark:text-slate-700 mb-2" />
                  <p className="text-sm font-medium">Your catalog is empty</p>
                  <p className="text-xs mt-1">List your first product on the left to start selling.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sellerProducts.map((p) => (
                    <div key={p._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col">
                      <div className="h-40 bg-gray-100 dark:bg-slate-950 overflow-hidden relative">
                        <img
                          src={p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200"}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-red-500 rounded-lg shadow-xs transition dark:bg-slate-900/90 dark:hover:bg-red-950/20"
                          title="Delete Product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</h3>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 line-clamp-2">{p.description || "No description provided."}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3">
                          <span className="text-xs text-gray-400 dark:text-slate-500">Price</span>
                          <span className="text-sm font-bold text-violet-600 dark:text-violet-400">${p.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "received_orders" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Orders Received from Buyers</h2>

            {sellerOrders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 text-center text-gray-400 dark:text-slate-500">
                <ClipboardList size={36} className="mx-auto text-gray-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-medium">No orders received yet</p>
                <p className="text-xs mt-1">Incoming orders will show up here in real-time.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-gray-100 dark:divide-slate-800">
                {sellerOrders.map((o) => (
                  <div key={o._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Buyer & Product */}
                    <div className="flex gap-4">
                      <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-950 shrink-0 border border-gray-100 dark:border-slate-800">
                        <img src={o.product?.image} alt={o.product?.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{o.product?.name}</h3>
                        <p className="text-xs text-gray-505 dark:text-slate-400 mt-0.5">
                          Buyer: <span className="font-semibold text-gray-700 dark:text-slate-350">{o.buyer?.name}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-550 mt-1">
                          Placed: {new Date(o.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Qty & Price */}
                    <div className="flex gap-6 sm:text-right shrink-0">
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">Qty</p>
                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-300 mt-0.5">{o.quantity}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Price</p>
                        <p className="text-sm font-bold text-violet-600 dark:text-violet-400 mt-0.5">${o.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                        o.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40"
                          : o.status === "accepted"
                          ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-455 dark:border-sky-900/40"
                          : o.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/40"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/40"
                      }`}>
                        {o.status.toUpperCase()}
                      </span>

                      {o.status === "pending" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(o._id, "accepted")}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-lg transition border border-emerald-200 dark:border-emerald-900/30"
                            title="Accept Order"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(o._id, "cancelled")}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/40 rounded-lg transition border border-rose-200 dark:border-rose-900/30"
                            title="Reject/Cancel Order"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {o.status === "accepted" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(o._id, "completed")}
                            className="flex items-center gap-1 px-2.5 py-1 bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white rounded-lg text-xs font-bold transition"
                          >
                            <CheckSquare size={13} />
                            Complete
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(o._id, "cancelled")}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/40 rounded-lg transition border border-rose-200 dark:border-rose-900/30"
                            title="Cancel Order"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "my_purchases" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">My Orders Placed</h2>

            {buyerOrders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 text-center text-gray-400 dark:text-slate-500">
                <ShoppingBag size={36} className="mx-auto text-gray-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-medium">You haven't bought anything yet</p>
                <p className="text-xs mt-1">Open a private chat shop, browse catalog and buy.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-gray-100 dark:divide-slate-800">
                {buyerOrders.map((o) => (
                  <div key={o._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Seller & Product */}
                    <div className="flex gap-4">
                      <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-950 shrink-0 border border-gray-100 dark:border-slate-800">
                        <img src={o.product?.image} alt={o.product?.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{o.product?.name}</h3>
                        <p className="text-xs text-gray-505 dark:text-slate-400 mt-0.5">
                          Seller: <span className="font-semibold text-gray-700 dark:text-slate-350">{o.seller?.name}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-550 mt-1">
                          Ordered: {new Date(o.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Qty & Price */}
                    <div className="flex gap-6 sm:text-right shrink-0">
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">Qty</p>
                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-300 mt-0.5">{o.quantity}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Price</p>
                        <p className="text-sm font-bold text-violet-600 dark:text-violet-400 mt-0.5">${o.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Right: Status */}
                    <div className="shrink-0 flex items-center">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                        o.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40 animate-pulse-subtle"
                          : o.status === "accepted"
                          ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-455 dark:border-sky-900/40"
                          : o.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/40"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/40"
                      }`}>
                        {o.status.toUpperCase()}
                      </span>
                      {o.status === "completed" && o.product && (
                        <button
                          onClick={() => setSelectedProductForReview(o.product)}
                          className="ml-2 px-2.5 py-1 bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30 rounded-lg text-[10px] font-bold transition active:scale-95"
                        >
                          Write Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Business Analytics & Metrics</h2>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Sales Revenue</p>
                <p className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-2">
                  ${sellerOrders.filter(o => o.status === "completed").reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Active Catalog Size</p>
                <p className="text-2xl font-black text-gray-800 dark:text-slate-200 mt-2">
                  {sellerProducts.length} <span className="text-xs text-gray-400 font-medium">products</span>
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Orders Completed</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  {sellerOrders.filter(o => o.status === "completed").length} / {sellerOrders.length}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Shop Followers</p>
                <p className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-2">
                  {user?.followers?.length || 0} <span className="text-xs text-gray-400 font-medium">followers</span>
                </p>
              </div>
            </div>

            {/* Customers base lists */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Recent Sales Orders</h3>
              <div className="space-y-2">
                {sellerOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-slate-550">No orders received to show metrics.</p>
                ) : (
                  sellerOrders.slice(0, 5).map(o => (
                    <div key={o._id} className="flex justify-between items-center border-b border-gray-50 dark:border-slate-850 pb-2 text-xs">
                      <div>
                        <p className="font-bold text-gray-700 dark:text-slate-300">{o.product?.name} (x{o.quantity})</p>
                        <p className="text-[10px] text-gray-400">Buyer: @{o.buyer?.name}</p>
                      </div>
                      <span className="font-bold text-violet-605">${o.totalPrice.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Write Review Dialog Modal */}
      {selectedProductForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-white shadow-2xl relative">
            <button
              onClick={() => setSelectedProductForReview(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 rounded-lg"
            >
              <X size={16} />
            </button>
            <h3 className="text-sm font-bold border-b border-gray-100 dark:border-slate-800 pb-2.5">
              Write Product Review
            </h3>
            
            <div className="mt-4 space-y-4">
              <p className="text-xs font-bold text-gray-705 dark:text-slate-300">
                Product: <span className="font-semibold text-violet-650 dark:text-violet-400">{selectedProductForReview.name}</span>
              </p>
              
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="text-2xl transition hover:scale-110 active:scale-95"
                  >
                    <span className={star <= reviewRating ? "text-amber-500" : "text-gray-300 dark:text-slate-700"}>★</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Review Message</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell us about the quality, sizing, shipping..."
                  className="w-full mt-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-55/60 dark:bg-slate-950 p-2.5 text-xs text-gray-705 dark:text-white focus:outline-none"
                />
              </div>

              <button
                onClick={() => {
                  socket.emit("submitReview", {
                    productId: selectedProductForReview._id,
                    rating: reviewRating,
                    comment: reviewComment,
                  });
                  setSelectedProductForReview(null);
                  setReviewComment("");
                  alert("Review submitted! Thank you.");
                }}
                className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white transition hover:bg-violet-750"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;
