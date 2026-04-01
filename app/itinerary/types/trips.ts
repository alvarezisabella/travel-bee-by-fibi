import {Day} from "../day"

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
    type: EventLabel;
    upvotes: number
    downvotes: number
    hasUpvoted?: boolean
    hasDownvoted?: boolean
    voteId?: string
}

export type EventLabel = "Activity" | "Transit" | "Reservation" | "Food" 
export type EventStatus = "Pending" | "Confirmed" | "Idea"

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
  downvotes: 0
} as Event;