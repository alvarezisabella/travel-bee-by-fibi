"use client";

import Link from "next/link"

export default function Footer() {
  return (
    <footer style={{ background: "#1a1a1a" }} className="px-10 pt-8 pb-5">

      {/* Top row — brand + nav */}
      <div className="flex items-start justify-between flex-wrap gap-6 mb-6">

        {/* Brand */}
        <div className="flex flex-col gap-2 max-w-[280px]">
          <Link href="/" className="text-white text-[20px] font-bold">
            TravelBee 🐝
          </Link>
          <p className="text-[13px] leading-relaxed" style={{ color: "#666" }}>
            AI-powered travel planning for every kind of trip. Plan smarter. Travel better.
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex gap-7 flex-wrap pt-1">
          {[
            { label: "Home",     href: "/"        },
            { label: "Log in",   href: "/login"   },
            { label: "Sign up",  href: "/signup"  },
            { label: "Contact",  href: "mailto:hello@travelbeebyfibi.com" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-[13px] transition-colors"
              style={{ color: "#888" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F5C300")}
              onMouseLeave={e => (e.currentTarget.style.color = "#888")}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "0.5px solid #2a2a2a", marginBottom: "14px" }} />

      {/* Bottom — copyright */}
      <p className="text-center text-[12px]" style={{ color: "#555" }}>
        © {new Date().getFullYear()} TravelBee. All rights reserved.
      </p>

    </footer>
  )
}