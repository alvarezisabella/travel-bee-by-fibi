"use client";
import { useSearchParams, useRouter } from "next/navigation";

export default function AcceptInvitePage() {
  const params = useSearchParams();
  const router = useRouter();

  const tripId = params.get("tripId");
  const email = params.get("email");

  const handleAcceptInvite = () => {
    router.push(`/itinerary/${tripId}`);
  };

  return (
    <div>
      <h1>You're invited 🎉</h1>
      <p>Trip ID: {tripId}</p>
      <p>Email: {email}</p>

      <button
        onClick={handleAcceptInvite}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Accept Invite
      </button>
    </div>
  );
}