import { MoreHorizontal, UserPlus } from "lucide-react";
import { useSelector } from "react-redux";


const ActiveUsers = () => {
    const users = useSelector(store => store.onlineUsers.users)
    console.log(users)
  return (
    <aside className="hidden w-[280px] flex-shrink-0 border-l border-gray-200 bg-white lg:flex lg:flex-col">
      
      {/* Header */}
      <div className="flex h-[72px] items-center justify-between border-b border-gray-200 px-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Active Users
          </h2>

          <p className="mt-0.5 text-xs text-gray-400">
            {users.length} people online
          </p>
        </div>

        <button className="rounded-xl p-2 text-gray-400 transition hover:bg-violet-50 hover:text-violet-600">
          <UserPlus size={18} />
        </button>
      </div>

      {/* Typing */}
      <div className="mx-4 mt-4 rounded-xl bg-violet-50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:300ms]" />
          </div>

          <p className="text-xs text-violet-600">
            Rahul is typing...
          </p>
        </div>
      </div>

      {/* Users */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Online
        </div>

        <div className="space-y-1">
          {users.map((user) => (
            <div
              key={user.userId}
              className="group flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-gray-50"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">
                  {user.avatar}
                </div>

                {/* Online dot */}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              {/* User Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {user.name}
                </p>

                <p className="truncate text-xs text-gray-400">
                  {user.role}
                </p>
              </div>

              {/* More */}
              <button className="hidden rounded-lg p-1.5 text-gray-400 group-hover:block hover:bg-gray-100 hover:text-gray-600">
                <MoreHorizontal size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default ActiveUsers;