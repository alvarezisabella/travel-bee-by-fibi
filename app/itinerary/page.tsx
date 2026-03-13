import DayPreview from "./day";
import TripHeader from "./components/TripHeader";
import AddDay from "./components/AddDay";
import { Trip } from "./types/trips";
import TripList from "./components/TripCard"
import {Event} from "./event"
import {Day} from "./day"


const SAMPLE_EVENTS:Event[] = [
    { id: "1", tripid: "1", dayid: "1", title: "Morning Event", description: "detail1.", status: "Confirmed", startTime: "09:00", duration: 30, location: "", travelers: "", type: "Activity" },
    { id: "2", tripid: "1", dayid: "1", title: "brunch", description: "detail2", status: "Pending", startTime: "11:00", duration: 60, location: "", travelers: "", type: "Food" },
    { id: "3", tripid: "1", dayid: "1", title: "shopping event", description: "", status: "Confirmed", startTime: "12:30", duration: 90, location: "", travelers: "", type: "Transit" },
    { id: "4", tripid: "1", dayid: "1", title: "afternoon event", description: "detail3", status: "Confirmed", startTime: "14:00", duration: 120, location: "", travelers: "", type: "Reservation" },
    { id: "5", tripid: "1", dayid: "1", title: "evening time", description: "", status: "Pending", startTime: "18:00", duration: 60, location: "", travelers: "", type: "Activity" },
  ]

const MOCK_DAYS:Day[] = [{id: "1", tripid: "1", events: SAMPLE_EVENTS}, {id: "2", tripid: "1", events:[]}]

async function getTrip(): Promise<Trip> {
  return {
    id: "1",
    title: "Add title",
    location: "Add location",
    startDate: "Add start date",
    endDate: "Add end date",
    coverImage: "image placeholder",
    travelers: [
      { id: "1", name: "Traveler 1" },
      { id: "2", name: "Traveler 2" },
      { id: "3", name: "Traveler 3" },
      { id: "4", name: "Traveler 4" }
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