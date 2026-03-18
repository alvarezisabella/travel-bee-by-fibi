export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">

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
    </div>
  )
}