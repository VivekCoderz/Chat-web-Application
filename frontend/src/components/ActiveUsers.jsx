import { X, Users } from "lucide-react";
import { useSelector } from "react-redux";

const ActiveUsers = ({ isOpen, onClose }) => {
  const users = useSelector(
    (store) => store.onlineUsers.users
  );

  return (
    <>
      {/* ================================= */}
      {/* MOBILE OVERLAY */}
      {/* ================================= */}

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}


      {/* ================================= */}
      {/* ACTIVE USERS SIDEBAR */}
      {/* ================================= */}

      <aside
        className={`
          fixed right-0 top-0 z-50
          flex h-full w-[85%] max-w-sm flex-col
          border-l border-gray-200
          bg-white shadow-xl

          transition-transform duration-300 ease-in-out

          md:static
          md:z-auto
          md:w-64
          md:max-w-none
          md:shrink-0
          md:translate-x-0
          md:shadow-none

          ${isOpen
            ? "translate-x-0"
            : "translate-x-full md:translate-x-0"
          }
        `}
      >

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 px-5">

          {/* Title */}
          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Users size={18} />
            </div>

            <div>

              <h2 className="text-sm font-semibold text-gray-900">
                Active Users
              </h2>

              <p className="text-[11px] text-gray-400">
                {users.length}{" "}
                {users.length === 1
                  ? "person"
                  : "people"}{" "}
                online
              </p>

            </div>

          </div>


          {/* Mobile Close */}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 md:hidden"
          >
            <X size={19} />
          </button>

        </div>


        {/* ================================= */}
        {/* USERS LIST */}
        {/* ================================= */}

        <div className="flex-1 overflow-y-auto p-3">

          {users.length === 0 ? (

            <div className="flex h-full flex-col items-center justify-center px-5 text-center">

              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                <Users
                  size={22}
                  className="text-gray-300"
                />
              </div>

              <p className="text-sm font-medium text-gray-500">
                No users online
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Online users will appear here.
              </p>

            </div>

          ) : (

            <div className="space-y-1">

              {users.map((user) => (

                <div
                  key={user._id || user.id}
                  className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-gray-50"
                >

                  {/* Avatar */}
                  <div className="relative shrink-0">

                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-xs font-semibold text-violet-600">

                      {user.avatar ? (

                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        user.name
                          ?.charAt(0)
                          .toUpperCase()

                      )}

                    </div>


                    {/* Online dot */}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />

                  </div>


                  {/* User Info */}
                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-medium text-gray-800">
                      {user.name}
                    </p>

                    <p className="text-[11px] text-emerald-500">
                      Online
                    </p>

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

export default ActiveUsers;