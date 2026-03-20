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
  coverImage: string
  days: Day[]
}