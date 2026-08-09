import { MessageCircle } from "lucide-react";

const Loader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">

      <div className="flex flex-col items-center">

        {/* Logo Animation */}
        <div className="relative">

          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse">

            <MessageCircle 
              size={40}
              className="text-white"
            />

          </div>

          <span className="absolute inset-0 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin"></span>

        </div>


        {/* Text */}

        <h2 className="mt-6 text-2xl font-semibold text-white">
          ChatApp
        </h2>

        <p className="mt-2 text-zinc-400">
          Connecting you...
        </p>


        {/* Dots */}

        <div className="flex gap-2 mt-5">

          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>

          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>

          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>

        </div>


      </div>

    </div>
  );
};

export default Loader;