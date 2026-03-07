import EventCardPreview from "./event";
import TripHeader from "./components/TripHeader";
import AddDay from "./components/AddDay";
import { Trip } from "./types/trips";

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
    ]
  }
}


export default async function itineraryList(){
    const trip = await getTrip()
    return (
    <main className="bg-gray-100 min-h-screen p-10">
      <TripHeader trip={trip} />
      <AddDay />
      <EventCardPreview/>
    </main>
  );
}