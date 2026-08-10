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

  if (!isOpen) return null;

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
      });
    });

    // Clear cart
    localStorage.removeItem("nexacart");
    setCartItems([]);
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
                      ${(item.product.price * item.quantity).toFixed(2)}
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
            <div className="flex justify-between items-center text-xs font-semibold text-gray-550 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="text-base font-extrabold text-gray-900 dark:text-white">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-md hover:scale-[0.98]"
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
