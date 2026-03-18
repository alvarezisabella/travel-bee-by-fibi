import Link from "next/link"

interface NavbarProps {
  tripsHref: string
}

export default function Navbar({ tripsHref }: NavbarProps) {
  return (
    <nav className="w-full flex items-center justify-between px-10 py-4 bg-white border-b border-gray-100 shadow-sm">

      {/* Logo - left */}
      <div className="flex-1">
        <img src="/travelbee-logo.svg" alt="TravelBee" width={220} height={55} />
      </div>

      {/* Nav Links - center */}
      <div className="flex-1 flex items-center justify-center gap-8">
        <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          Home
        </Link>
        <Link href={tripsHref} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          Trips
        </Link>
        <Link href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          Explore
        </Link>
      </div>

      {/* Auth Buttons - right */}
      <div className="flex-1 flex items-center justify-end gap-3">
        <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-all">
          Login
        </Link>
        <Link href="/signup" className="text-sm font-semibold text-gray-900 bg-[#F5C842] hover:bg-[#e6b93a] px-5 py-2 rounded-full transition-all shadow-sm">
          Sign Up
        </Link>
      </div>

    </nav>
  )
}