import ProfileHeader from "./components/ProfileHeader"
import TripHistory from "./components/TripHistory"

function UpcomingCalendar() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-800">Upcoming Trips</p>
      <p className="text-xs text-gray-400 -mt-1">Your next planned adventures</p>
      <div className="w-full h-64 bg-gray-100 rounded-xl mt-2" />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <ProfileHeader />
        <div className="flex gap-6 items-start">
          <div className="w-80 shrink-0">
            <UpcomingCalendar />
          </div>
          <div className="flex-1">
            <TripHistory />
          </div>
        </div>
      </div>
    </div>
  )
}