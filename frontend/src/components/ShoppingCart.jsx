import { useState, useEffect } from "react";
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight } from "lucide-react";
import { socket } from "../socket/socket";

// Helper function to get cart
export const getCart = () => {
  return JSON.parse(localStorage.getItem("nexacart") || "[]");
};

// Helper function to add to cart
export const addToCart = (product, sellerId, sellerName) => {
  const cart = getCart();
  const existing = cart.find((item) => item.product._id === product._id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ product, quantity: 1, sellerId, sellerName });
  }
  localStorage.setItem("nexacart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdate"));
};

const ShoppingCart = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [activeCoupon, setActiveCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  useEffect(() => {
    setCartItems(getCart());

    const handleCartUpdate = () => {
      setCartItems(getCart());
    };

    window.addEventListener("cartUpdate", handleCartUpdate);
    return () => {
      window.removeEventListener("cartUpdate", handleCartUpdate);
    };
  }, [isOpen]);

  const updateQuantity = (productId, change) => {
    const updated = cartItems
      .map((item) => {
        if (item.product._id === productId) {
          const qty = item.quantity + change;
          return { ...item, quantity: qty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    localStorage.setItem("nexacart", JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event("cartUpdate"));
  };

  const removeItem = (productId) => {
    const updated = cartItems.filter((item) => item.product._id !== productId);
    localStorage.setItem("nexacart", JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event("cartUpdate"));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // Place socket orders for each item in the cart
    cartItems.forEach((item) => {
      socket.emit("createOrder", {
        sellerId: item.sellerId,
        productId: item.product._id,
        quantity: item.quantity,
        couponApplied: activeCoupon || undefined,
        discountAmount: activeCoupon ? discount : undefined,
      });
    });

    // Clear cart
    localStorage.removeItem("nexacart");
    setCartItems([]);
    setActiveCoupon("");
    setCouponCode("");
    setDiscount(0);
    setCouponSuccess("");
    setCouponError("");
    window.dispatchEvent(new Event("cartUpdate"));

    // Confetti animation
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      onClose();
    }, 3000);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  useEffect(() => {
    if (activeCoupon === "NEXA10") {
      setDiscount(subtotal * 0.1);
    } else if (activeCoupon === "SAVE200") {
      setDiscount(Math.min(200, subtotal));
    } else {
      setDiscount(0);
    }
  }, [subtotal, activeCoupon]);

  // Must come after every hook: returning early before the coupon useEffect
  // changed the hook count between closed/open renders and crashed React.
  if (!isOpen) return null;

  const deliveryFee = subtotal > 0 ? (subtotal >= 1000 ? 0 : 40) : 0;
  const finalTotal = Math.max(0, subtotal - discount + deliveryFee);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Cart Drawer */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-[85%] max-w-md flex-col border-l border-gray-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200">
        
        {/* Header */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 px-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-violet-600" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Shopping Cart</h2>
            <span className="bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-55/40 dark:bg-slate-950/40">
          {cartItems.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center px-4">
              <ShoppingBag size={36} className="text-gray-300 dark:text-slate-700 mb-2" />
              <p className="text-xs font-bold text-gray-600 dark:text-slate-400">Your Cart is Empty</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                Browse seller catalogs or swipe Reels to add items.
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-850 p-3.5 flex gap-3 shadow-xs"
              >
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-955 shrink-0 border border-gray-100 dark:border-slate-800">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-[9px] text-gray-405 dark:text-slate-500">
                      Seller: <span className="font-semibold">{item.sellerName}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-violet-650 dark:text-violet-400">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-1 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.product._id, -1)}
                        className="text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-300">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product._id, 1)}
                        className="text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.product._id)}
                  className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg dark:hover:bg-rose-950/20 shrink-0 self-start"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

      {/* Footer subtotal */}
      {cartItems.length > 0 && (
        <div className="shrink-0 border-t border-gray-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-4">
          
          {/* Coupon Code Input */}
          <div className="space-y-1.5 border-b border-gray-100 dark:border-slate-800/60 pb-3">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Have a Coupon?</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. NEXA10, SAVE200"
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-gray-800 dark:text-white outline-none focus:border-violet-500 transition"
                disabled={!!activeCoupon}
              />
              {activeCoupon ? (
                <button
                  onClick={() => {
                    setActiveCoupon("");
                    setCouponCode("");
                    setDiscount(0);
                    setCouponSuccess("");
                  }}
                  className="py-1.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-605 dark:text-rose-400 text-[10px] font-bold hover:bg-rose-100 transition cursor-pointer"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCouponError("");
                    setCouponSuccess("");
                    const code = couponCode.trim().toUpperCase();
                    if (code === "NEXA10") {
                      setActiveCoupon("NEXA10");
                      setCouponSuccess("NEXA10 applied: 10% Off!");
                    } else if (code === "SAVE200") {
                      setActiveCoupon("SAVE200");
                      setCouponSuccess("SAVE200 applied: ₹200 Off!");
                    } else {
                      setCouponError("Invalid coupon code");
                    }
                  }}
                  className="py-1.5 px-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-750 dark:text-violet-400 text-[10px] font-black hover:bg-violet-100 transition cursor-pointer border border-violet-200 dark:border-violet-900/30"
                >
                  Apply
                </button>
              )}
            </div>
            {couponError && <p className="text-[9px] font-bold text-rose-500">{couponError}</p>}
            {couponSuccess && <p className="text-[9px] font-bold text-emerald-500">{couponSuccess}</p>}
          </div>

          {/* Calculations Breakdown */}
          <div className="space-y-2 text-xs font-semibold text-gray-550 dark:text-slate-400">
            <div className="flex justify-between items-center text-[11px]">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-800 dark:text-slate-200">₹{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-[11px] text-emerald-600 font-bold">
                <span>Coupon Discount</span>
                <span>- ₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[11px]">
              <span>Delivery Charge</span>
              <span className="font-semibold text-gray-800 dark:text-slate-200">
                {deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 dark:text-white border-t border-dashed border-gray-150 dark:border-slate-800/50 pt-2">
              <span>Final Total</span>
              <span className="text-sm font-black text-violet-605 dark:text-violet-400">₹{finalTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-violet-650 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-md hover:scale-[0.98] cursor-pointer mt-1"
          >
            Checkout Order
            <ArrowRight size={13} />
          </button>
        </div>
      )}
      </aside>

      {/* Confetti Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 z-55 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white">
          <div className="relative p-6 text-center animate-bounce-subtle">
            <span className="text-5xl">🎉</span>
            <h2 className="text-lg font-black mt-3">Order Placed Successfully!</h2>
            <p className="text-xs text-gray-300 mt-1">Receipts sent in private seller chats.</p>
          </div>

          {/* Simple floating confetti animation elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute h-2 w-2 rounded-full animate-float-confetti"
                style={{
                  backgroundColor: ["#EC4899", "#8B5CF6", "#10B981", "#F59E0B", "#3B82F6"][i % 5],
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ShoppingCart;
