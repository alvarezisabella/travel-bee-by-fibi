import { Day } from "../day"

export interface Traveler {
  id: string
  name: string
  role: string
  avatar?: string
}

export interface Trip {
  id: string
  title: string
  location?: string
  startDate?: string
  endDate?: string
  travelers: Traveler[]
  coverImage?: string
  cover_photo_url?: string | null
  cover_photo_position?: number | null
  days: Day[]
}

export interface Event {
  id: string
  itineraryid: string
  dayid: string
  title: string
  description: string
  status: EventStatus
  startTime: string
  duration: number
  location: string
  travelers: string
  type: EventLabel
  upvotes: number
  downvotes: number
  hasUpvoted?: boolean
  hasDownvoted?: boolean
  voteId?: string
  lat?: number
  lng?: number
}

export type EventLabel = "Activity" | "Transit" | "Reservation" | "Food"
export type EventStatus = "Pending" | "Confirmed" | "Idea"

export const cardColor = { bg: "bg-[#fcfcfc]", bar: "bg-[#dbdbdb]", text: "text-[#262626]", time: "text-[#3a4042]" }

export const LABEL_MAP: Record<EventLabel, { bg: string; bar: string; text: string; time: string }> = {
  Activity: { bg: "bg-[#eef4f0]", bar: "bg-[#8fad9b]", text: "text-[#3a5a46]", time: "text-[#6a9078]" },
  Transit: { bg: "bg-[#edf0f4]", bar: "bg-[#7a8fa6]", text: "text-[#2a3d52]", time: "text-[#5a7090]" },
  Reservation: { bg: "bg-[#f8f3e6]", bar: "bg-[#c9a84c]", text: "text-[#5a420a]", time: "text-[#8a6820]" },
  Food: { bg: "bg-[#f8eff2]", bar: "bg-[#b87a8a]", text: "text-[#5a2234]", time: "text-[#905060]" },
}

export const STATUS_MAP: Record<EventStatus, string> = {
  Confirmed: "bg-[#98d99f]",
  Pending: "bg-[#ffcd59]",
  Idea: "bg-[#9c8a8a]"
}

export const emptyEvent = {
  id: "",
  itineraryid: "",
  dayid: "",
  title: "",
  description: "",
  status: "Pending",
  startTime: "09:00",
  duration: 60,
  location: "",
  travelers: "",
  type: "Activity",
  upvotes: 0,
  downvotes: 0,
  lat: 0,
  lng: 0
} as Event

export interface Message {
  id: string
  text: string
  widgets?: Widget[]
  sender: "user" | "bot"
  timestamp: Date
}

export interface Widget {
  id: string
  title: string
  location?: string
  description?: string
  type: EventLabel
  image_url?: string
  rating?: number
  price?: number
}