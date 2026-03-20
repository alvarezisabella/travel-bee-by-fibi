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

        {/* ── CONTENT ── */}
        <div className="w-full max-w-md">
          <UpcomingCalendar />
        </div>
      </div>
    </div>
  )
}