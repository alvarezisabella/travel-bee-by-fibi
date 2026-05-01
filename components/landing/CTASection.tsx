// components/landing/CTASection.tsx
"use client"
import { useRouter } from "next/navigation"

export default function CTASection() {
  const router = useRouter()

  return (
    <section className="w-full bg-[#F5F5F5] py-24 px-6 flex flex-col items-center text-center gap-5">

      {/* Glowing pill badge */}
      <span
        className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[#92600a] bg-yellow-50 border border-[#F5C300] rounded-full px-5 py-1.5"
        style={{
          boxShadow: "0 0 0 4px rgba(245,195,0,0.12), 0 0 16px rgba(245,195,0,0.25)",
        }}
      >
        🐝 Free to get started
      </span>

      {/* Headline */}
      <h2 className="font-raleway font-extrabold text-gray-900 leading-[1.1] m-0"
        style={{ fontSize: "clamp(36px, 5vw, 52px)" }}
      >
        Your next adventure<br />
        <em className="text-[#F5C300] italic not-italic" style={{ fontStyle: "italic" }}>
          starts here.
        </em>
      </h2>

      {/* Subtext */}
      <p className="text-[15px] text-gray-500 leading-relaxed max-w-md m-0">
        Create a free account to save trips, collaborate with friends, and let Agent Atlas plan for you.
      </p>

      {/* Primary button */}
      <button
        onClick={() => router.push("/signup")}
        className="mt-1 bg-white text-gray-900 border border-gray-200 hover:border-[#F5C300] hover:bg-yellow-50 hover:text-[#3d3000] font-medium text-[15px] px-10 py-3.5 rounded-xl transition-all whitespace-nowrap cursor-pointer"
      >
        Get started for free
      </button>

      {/* Sign in link */}
      <p className="text-[13px] text-gray-400">
        Already have an account?{" "}
        <button
          onClick={() => router.push("/login")}
          className="text-[#b8860b] hover:text-[#F5C300] font-medium transition-colors bg-transparent border-none cursor-pointer"
        >
          Sign in →
        </button>
      </p>

    </section>
  )
}