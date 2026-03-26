"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from '@/lib/supabase/browser'

export default function AcceptInvitePage() {
  const params = useSearchParams();
  const router = useRouter();

  const tripId = params.get("tripId");
  const emailFromLink = params.get("email");

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  // 1) Check Supabase session directly (uses cookies that login set)
  useEffect(() => {
    const checkAuth = async () => {
      if (!tripId) {
        setError("Invalid invite link. Missing trip.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseBrowser.auth.getSession();

      if (error) {
        console.error(error);
        setError("Failed to check login status.");
        setLoading(false);
        return;
      }

      if (!data.session) {
        // Not logged in → redirect once to login with redirect back
        const redirectUrl = encodeURIComponent(
          `/accept-invite?tripId=${tripId}&email=${emailFromLink ?? ""}`
        );
        router.push(`/login?redirect=${redirectUrl}`);
        return;
      }

      setUser(data.session.user);
      setLoading(false);
    };

    checkAuth();
  }, [tripId, emailFromLink, router]);

  // 2) Accept invite via your existing API route
  const handleAcceptInvite = async () => {
    if (!tripId) {
      setError("Invalid invite link. Missing trip.");
      return;
    }

    if (!user) {
      setError("You need to be logged in to accept this invite.");
      return;
    }

    setAccepting(true);
    setError("");

    try {
      const res = await fetch("/api/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to accept invite.");
        return;
      }

      router.push(`/itinerary/${tripId}`);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Failed to accept invite.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const displayEmail = emailFromLink || user?.email || "Unknown";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">You're invited 🎉</h1>

        <p className="mb-2">
          <strong>Email:</strong> {displayEmail}
        </p>

        <p className="mb-4">You’ve been invited to join this trip.</p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleAcceptInvite}
          disabled={accepting}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {accepting ? "Accepting..." : "Accept Invite"}
        </button>
      </div>
    </div>
  );
}