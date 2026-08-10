import { useEffect, useState } from "react";
import { X, ShoppingBag, ShoppingCart, Star } from "lucide-react";
import { socket } from "../socket/socket";
import { useDispatch, useSelector } from "react-redux";
import { setSellerProducts } from "../Redux/feature/generalChatSlice";
import { addToCart } from "./ShoppingCart";

const StorefrontCatalog = ({ isOpen, onClose, sellerId, sellerName }) => {
  const dispatch = useDispatch();
  const sellerProducts = useSelector((store) => store.generalCharReducer.sellerProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !sellerId) return;

    setLoading(true);
    socket.emit("getSellerProducts", { sellerId });

    const handleSellerProducts = (products) => {
      dispatch(setSellerProducts(products));
      setLoading(false);
    };

    socket.on("sellerProducts", handleSellerProducts);

    return () => {
      socket.off("sellerProducts", handleSellerProducts);
    };
  }, [isOpen, sellerId, dispatch]);

  if (!isOpen) return null;

  const handleBuyProduct = (product) => {
    const confirmBuy = window.confirm(
      `Confirm Order:\n\nProduct: ${product.name}\nPrice: $${product.price.toFixed(2)}\n\nWould you like to place this order?`
    );

    if (confirmBuy) {
      socket.emit("createOrder", {
        sellerId,
        productId: product._id,
        quantity: 1,
      });
      alert(`Order placed! Check details in the chat receipt or your Shop Dashboard.`);
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity md:hidden"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <aside
        className={`
          fixed right-0 top-0 z-50
          flex h-full w-[85%] max-w-md flex-col
          border-l border-gray-200 bg-white
          dark:border-slate-800 dark:bg-slate-900
          transition-transform duration-300 ease-in-out
          md:static
          md:z-auto
          md:w-80
          md:max-w-none
          md:shrink-0
          md:translate-x-0
          md:shadow-none
          transition-colors duration-200
        `}
      >
        {/* Header */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 px-5 bg-white dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-405">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {sellerName}'s Shop
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">
                Browse catalog and order items
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Product Catalog list */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400 dark:text-slate-500">
              Loading catalog...
            </div>
          ) : sellerProducts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center px-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-850 shadow-xs">
                <ShoppingBag size={20} className="text-gray-300 dark:text-slate-650" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Catalog is empty</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                {sellerName} hasn't listed any products in their shop yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sellerProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-850 overflow-hidden shadow-xs flex flex-col transition hover:shadow-sm"
                >
                  <div className="h-36 bg-gray-50 dark:bg-slate-950 overflow-hidden border-b border-gray-100 dark:border-slate-850 relative">
                    <img
                      src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200"}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
                        <span className="text-sm font-bold text-violet-600 dark:text-violet-400 shrink-0">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Product Rating */}
                      {product.averageRating > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-500 font-bold">
                          <span>★</span>
                          <span>{product.averageRating.toFixed(1)}</span>
                          <span className="text-gray-400 dark:text-slate-500 font-normal">({product.reviews?.length || 0})</span>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 line-clamp-2">
                        {product.description || "No description provided."}
                      </p>

                      {/* Collapsed Reviews List */}
                      {product.reviews && product.reviews.length > 0 && (
                        <div className="mt-3 border-t border-gray-100 dark:border-slate-800 pt-2 shrink-0">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Customer Feedback</p>
                          <div className="max-h-16 overflow-y-auto mt-1 space-y-1 scrollbar-none">
                            {product.reviews.map((r, i) => (
                              <div key={i} className="text-[10px] text-gray-600 dark:text-slate-400">
                                <span className="font-bold">@{r.user?.name || "user"}</span>: {r.comment} ({r.rating}★)
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          addToCart(product, sellerId, sellerName);
                          alert("Added to cart! Open cart via the header shop menu.");
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-205 py-2 text-xs font-bold transition hover:bg-gray-50 dark:hover:bg-slate-850"
                      >
                        Add Cart
                      </button>
                      <button
                        onClick={() => handleBuyProduct(product)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-violet-605 py-2 text-xs font-bold text-white transition hover:bg-violet-750 active:scale-[0.98]"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default StorefrontCatalog;
