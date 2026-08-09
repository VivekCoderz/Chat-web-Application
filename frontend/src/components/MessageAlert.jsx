import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const MessageAlert = ({ message, type = "success", clearMessage }) => {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      clearMessage();
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  const isError = type === "error";

  return (
    <div
      className={`
        fixed top-5 right-5 z-50
        w-[360px]
        animate-slide-in
      `}
    >
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Left Color Line */}
        <div
          className={`absolute left-0 top-0 h-full w-1 ${
            isError ? "bg-red-500" : "bg-emerald-500"
          }`}
        />

        <div className="flex items-start gap-3 p-4 pl-5">
          <div
            className={`mt-0.5 ${
              isError ? "text-red-500" : "text-emerald-500"
            }`}
          >
            {isError ? (
              <AlertCircle size={24} />
            ) : (
              <CheckCircle2 size={24} />
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {isError ? "Something went wrong" : "Success"}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {message}
            </p>
          </div>

          <button
            onClick={clearMessage}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-gray-100">
          <div
            className={`h-full ${
              isError ? "bg-red-500" : "bg-emerald-500"
            } animate-progress`}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageAlert;