import { notFound } from 'next/navigation'
import { DEMO_ITINERARIES } from '../demoData'
import { MapPin, Calendar, Clock } from 'lucide-react'
import BackButton from './BackButton'
import DemoAccordion from './DemoAccordion'
import HeroButtons from './HeroButtons'

export default async function DemoViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const itinerary = DEMO_ITINERARIES[id]
  if (!itinerary) notFound()

  const totalDays = itinerary.days.length

  return (
    <main className="min-h-screen bg-[#F5F5F5]">

      {/* Hero */}
      <div className="relative w-full h-[320px] md:h-[400px] overflow-hidden rounded-b-3xl">
        <img
          src={itinerary.coverImg}
          alt={itinerary.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent rounded-b-3xl" />

        <BackButton />

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="max-w-5xl mx-auto flex items-end justify-between gap-4">

            {/* Left: trip info */}
            <div>
              <h1 className="font-raleway font-extrabold text-2xl md:text-3xl text-white leading-tight mb-1">
                {itinerary.title}
              </h1>
              <p className="text-white/70 text-[13px] mb-3 max-w-md leading-relaxed">
                {itinerary.location}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-white/80 text-[12px] flex items-center gap-1">
                  <Clock size={12} /> {totalDays} days
                </span>
                <span className="text-white/80 text-[12px] flex items-center gap-1">
                  <MapPin size={12} /> {itinerary.location}
                </span>
                <span className="text-white/80 text-[12px] flex items-center gap-1">
                  <Calendar size={12} /> {itinerary.startDate} – {itinerary.endDate}
                </span>
              </div>
            </div>

            {/* Right: Export + Edit buttons */}
            <HeroButtons demoId={id} />

          </div>
        </div>
      </div>

      {/* Day accordion */}
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-4">
        <DemoAccordion days={itinerary.days} />
      </div>

    </main>
  )
}