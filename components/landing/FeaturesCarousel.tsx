// components/landing/FeaturesCarousel.tsx
"use client"
import { useState } from "react"

const features = [
  {
    tag: "AI planning",
    title: "Agent Atlas",
    desc: "AI assistant that builds your itinerary, refines ideas, and suggests activities based on your unique travel style.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id="iconGrad0" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5C300"/>
            <stop offset="100%" stopColor="#FF8C00"/>
          </linearGradient>
        </defs>
        <rect x="7" y="7" width="10" height="10" rx="2" stroke="url(#iconGrad0)"/>
        <path d="M7 9H4M7 12H4M7 15H4M17 9h3M17 12h3M17 15h3M9 7V4M12 7V4M15 7V4M9 17v3M12 17v3M15 17v3" stroke="url(#iconGrad0)"/>
      </svg>
    ),
  },
  {
    tag: "Group trips",
    title: "Real-time collaboration",
    desc: "Invite friends, vote on activities, leave comments, and keep everyone on the same page — no more back-and-forth.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id="iconGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5C300"/>
            <stop offset="100%" stopColor="#FF8C00"/>
          </linearGradient>
        </defs>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="url(#iconGrad1)"/>
        <circle cx="9" cy="7" r="4" stroke="url(#iconGrad1)"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="url(#iconGrad1)"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="url(#iconGrad1)"/>
      </svg>
    ),
  },
  {
    tag: "Stay organized",
    title: "Document hub",
    desc: "Keep all your confirmations, tickets, and travel docs in one organized space. No more digging through email threads or lost PDFs.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" strokeWidth="2" strokeLinecap="round">
        <defs>
          <linearGradient id="iconGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5C300"/>
            <stop offset="100%" stopColor="#FF8C00"/>
          </linearGradient>
        </defs>
        <rect x="8" y="6" width="24" height="30" rx="3" stroke="url(#iconGrad2)"/>
        <path d="M14 14h12M14 20h12M14 26h8" stroke="url(#iconGrad2)"/>
        <path d="M26 2v8h8" strokeWidth="1.5" stroke="url(#iconGrad2)"/>
      </svg>
    ),
  },
  {
    tag: "Discover more",
    title: "Smart recommendations",
    desc: "Discover hidden gems and curated suggestions powered by local insights. Move beyond generic tourist traps to authentic experiences.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id="iconGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5C300"/>
            <stop offset="100%" stopColor="#FF8C00"/>
          </linearGradient>
        </defs>
        <circle cx="10" cy="10" r="7" stroke="url(#iconGrad3)"/>
        <path d="M21 21l-4.35-4.35" stroke="url(#iconGrad3)"/>
        <path d="M10 7v6M7 10h6" stroke="url(#iconGrad3)"/>
      </svg>
    ),
  },
  {
    tag: "Stay flexible",
    title: "Flexible scheduling",
    desc: "Adjust your plans on the fly with drag-and-drop simplicity. Rearrange days, swap activities, and adapt to changes without starting over.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" strokeWidth="2" strokeLinecap="round">
        <defs>
          <linearGradient id="iconGrad4" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5C300"/>
            <stop offset="100%" stopColor="#FF8C00"/>
          </linearGradient>
        </defs>
        <rect x="6" y="8" width="28" height="26" rx="4" stroke="url(#iconGrad4)"/>
        <path d="M6 18h28M13 6v4M27 6v4" stroke="url(#iconGrad4)"/>
        <path d="M14 26h4v4h-4zM22 22h4v4h-4z" stroke="url(#iconGrad4)"/>
      </svg>
    ),
  },
]

export default function FeaturesCarousel() {
  const [idx, setIdx] = useState(0)

  const prev = () => setIdx(i => (i - 1 + features.length) % features.length)
  const next = () => setIdx(i => (i + 1) % features.length)
  const f = features[idx]
  const progress = ((idx + 1) / features.length) * 100

  return (
    <section className="w-full bg-[#F5F5F5] py-24 px-6 flex flex-col items-center">
      <h2 className="font-raleway font-extrabold text-3xl md:text-4xl text-gray-900 text-center mb-14">
        Everything you need in one place
      </h2>

      <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex gap-4 transition-transform duration-350 ease-in-out"
            style={{ transform: `translateX(calc(-${idx * 100}% - ${idx * 16}px))` }}
          >
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className="flex-shrink-0 w-full bg-white border border-gray-100 rounded-2xl px-8 py-10 flex flex-col items-center text-center gap-4"
              >
                {/* Icon with gradient background */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #fffbeb, #fff4e0)",
                    border: "1px solid #fde68a",
                  }}
                >
                  {feat.icon}
                </div>

                {/* Tag pill */}
                <span className="text-[10px] font-medium uppercase tracking-widest text-[#b8860b] bg-yellow-50 border border-yellow-100 rounded-full px-3 py-1">
                  {feat.tag}
                </span>

                {/* Title */}
                <h3 className="font-raleway font-extrabold text-[20px] text-gray-900">
                  {feat.title}
                </h3>

                {/* Description */}
                <p className="text-[14px] text-gray-500 leading-relaxed max-w-sm">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-[2px] bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-350 ease-in-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(to right, #F5C300, #FF8C00)",
            }}
          />
        </div>

        {/* Nav */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full border border-gray-200 hover:border-[#F5C300] hover:bg-yellow-50 bg-white flex items-center justify-center text-gray-400 hover:text-[#b8860b] text-lg transition-all cursor-pointer"
          >
            ‹
          </button>

          <div className="flex gap-1.5 items-center">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-250 cursor-pointer ${
                  i === idx ? "w-6" : "w-1.5 bg-gray-300 hover:bg-gray-400"
                }`}
                style={i === idx ? {
                  background: "linear-gradient(to right, #F5C300, #FF8C00)",
                } : {}}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-9 h-9 rounded-full border border-gray-200 hover:border-[#F5C300] hover:bg-yellow-50 bg-white flex items-center justify-center text-gray-400 hover:text-[#b8860b] text-lg transition-all cursor-pointer"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  )
}