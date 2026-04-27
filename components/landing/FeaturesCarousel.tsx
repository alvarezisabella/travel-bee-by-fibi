// components/landing/FeaturesCarousel.tsx
"use client"
import { useState } from "react"

const features = [
  {
    tag: "AI planning",
    title: "Agent Atlas",
    desc: "AI assistant that builds your itinerary, refines ideas, and suggests activities based on your unique travel style.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" stroke="#F5C300" strokeWidth="2" strokeLinecap="round">
        <circle cx="20" cy="14" r="6" />
        <path d="M8 34c0-6.627 5.373-10 12-10s12 3.373 12 10" />
        <path d="M26 10l3-3M14 10l-3-3" />
      </svg>
    ),
  },
  {
    tag: "Group trips",
    title: "Real-time collaboration",
    desc: "Invite friends, vote on activities, leave comments, and keep everyone on the same page — no more back-and-forth.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" stroke="#F5C300" strokeWidth="2" strokeLinecap="round">
        <circle cx="14" cy="14" r="5" />
        <circle cx="26" cy="14" r="5" />
        <path d="M6 34c0-5 3.6-8 8-8h12c4.4 0 8 3 8 8" />
      </svg>
    ),
  },
  {
    tag: "Stay organized",
    title: "Document hub",
    desc: "Keep all your confirmations, tickets, and travel docs in one organized space. No more digging through email threads or lost PDFs.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" stroke="#F5C300" strokeWidth="2" strokeLinecap="round">
        <rect x="8" y="6" width="24" height="30" rx="3" />
        <path d="M14 14h12M14 20h12M14 26h8" />
        <path d="M26 2v8h8" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    tag: "Discover more",
    title: "Smart recommendations",
    desc: "Discover hidden gems and curated suggestions powered by local insights. Move beyond generic tourist traps to authentic experiences.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" stroke="#F5C300" strokeWidth="2" strokeLinecap="round">
        <path d="M20 6l3.5 7 7.5 1-5.5 5.5 1.5 7.5L20 23l-7 4 1.5-7.5L9 14l7.5-1z" />
      </svg>
    ),
  },
  {
    tag: "Stay flexible",
    title: "Flexible scheduling",
    desc: "Adjust your plans on the fly with drag-and-drop simplicity. Rearrange days, swap activities, and adapt to changes without starting over.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" stroke="#F5C300" strokeWidth="2" strokeLinecap="round">
        <rect x="6" y="8" width="28" height="26" rx="4" />
        <path d="M6 18h28M13 6v4M27 6v4" />
        <path d="M14 26h4v4h-4zM22 22h4v4h-4z" />
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
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-center justify-center">
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
            className="h-full bg-[#F5C300] rounded-full transition-all duration-350 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Nav */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full border border-gray-200 hover:border-[#F5C300] hover:bg-yellow-50 bg-white flex items-center justify-center text-gray-400 hover:text-[#b8860b] text-lg transition-all"
          >
            ‹
          </button>

          <div className="flex gap-1.5 items-center">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-250 ${
                  i === idx ? "w-6 bg-[#F5C300]" : "w-1.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-9 h-9 rounded-full border border-gray-200 hover:border-[#F5C300] hover:bg-yellow-50 bg-white flex items-center justify-center text-gray-400 hover:text-[#b8860b] text-lg transition-all"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  )
}