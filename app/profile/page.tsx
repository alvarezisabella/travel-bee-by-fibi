function UpcomingCalendar() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-800">Upcoming Trips</p>
      <p className="text-xs text-gray-400 -mt-1">Your next planned adventures</p>

      {/* Skeleton calendar */}
      <div className="w-full h-64 bg-gray-100 rounded-xl mt-2" />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* ── PROFILE HEADER ── */}
        <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs text-center leading-tight px-1">
            Profile Photo
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <p className="text-xl font-bold text-gray-800">Full Name</p>
            <p className="text-sm text-gray-400">user@email.com</p>
            <p className="text-xs text-gray-300">Member since January 2025</p>
          </div>

          <button className="w-28 h-9 bg-yellow-400 rounded-full text-sm font-medium text-gray-900">
            Edit Profile
          </button>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex gap-6 items-start">

          {/* LEFT (Calendar) */}
          <div className="w-80 shrink-0">
            <UpcomingCalendar />
          </div>

          {/* RIGHT (My Trips) */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-gray-800">My Trips</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    All trips created or joined
                  </p>
                </div>

                <div className="h-8 px-4 bg-[#F5C842] rounded-full flex items-center justify-center text-xs font-semibold text-gray-900">
                  + New Trip
                </div>
              </div>

              {/* Trip cards */}
              <div className="grid grid-cols-3 gap-3">
                {["Trip Card 1", "Trip Card 2", "Trip Card 3"].map((trip) => (
                  <div
                    key={trip}
                    className="rounded-xl overflow-hidden border border-gray-100"
                  >
                    <div className="w-full h-24 bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                      Cover Photo
                    </div>

                    <div className="p-3 flex flex-col gap-1">
                      <p className="text-sm font-semibold text-gray-700">{trip}</p>
                      <p className="text-xs text-gray-400">
                        Trip name · Location
                      </p>
                      <p className="text-xs text-gray-400">
                        Start – End date
                      </p>

                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3].map((a) => (
                          <div
                            key={a}
                            className="w-5 h-5 rounded-full bg-gray-300 border border-white -ml-1 first:ml-0"
                          />
                        ))}
                        <p className="text-xs text-gray-400 ml-1 self-center">
                          +2
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}