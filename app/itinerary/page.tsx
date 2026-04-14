import TripHeader from "./components/TripHeader";
import { Trip } from "./types/types";
import TripList from "./components/TripCard";
import {Event} from "./types/types"
import {Day} from "./day"


const SAMPLE_EVENTS:Event[] = [
    { id: "1", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", dayid: "1", title: "Morning Event", description: "detail1.", status: "Confirmed", startTime: "09:00", duration: 30, location: "", travelers: "", type: "Activity", upvotes: 0, downvotes: 0 },
    { id: "2", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", dayid: "1", title: "brunch", description: "detail2", status: "Pending", startTime: "11:00", duration: 60, location: "", travelers: "", type: "Food", upvotes: 0, downvotes: 0 },
    { id: "3", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", dayid: "1", title: "shopping event", description: "", status: "Confirmed", startTime: "12:30", duration: 90, location: "", travelers: "", type: "Transit", upvotes: 0, downvotes: 0 },
    { id: "4", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", dayid: "1", title: "afternoon event", description: "detail3", status: "Confirmed", startTime: "14:00", duration: 120, location: "", travelers: "", type: "Reservation", upvotes: 0, downvotes: 0 },
    { id: "5", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", dayid: "1", title: "evening time", description: "", status: "Pending", startTime: "18:00", duration: 60, location: "", travelers: "", type: "Activity", upvotes: 0, downvotes: 0 },
  ]

const MOCK_DAYS:Day[] = [{id: "1", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", events: SAMPLE_EVENTS, date: "2023-10-10"}, {id: "2", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", events: [], date: "2023-10-11"}]

async function getTrip(): Promise<Trip> {
  return {
    id: "165f0341-9cab-456f-97f8-c727b09fa36b",
    title: "Add title",
    location: "Add location",
    startDate: "Add start date",
    endDate: "Add end date",
    coverImage: "image placeholder",
    travelers: [
      { id: "1", name: "Traveler 1", role: "Organizer" },
      { id: "2", name: "Traveler 2", role: "Participant" },
      { id: "3", name: "Traveler 3", role: "Participant" },
      { id: "4", name: "Traveler 4", role: "Participant" }
    ],
    days: MOCK_DAYS
  }
}


export default async function itineraryList(){
    const trip = await getTrip()
    return (
    <main className="bg-gray-100 min-h-screen p-10">
      <TripHeader trip={trip} />
      <TripList trip={trip}/>
    </main>
  );
}