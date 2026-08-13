export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

export interface PlaceDetails {
  lat: number;
  lng: number;
  description: string;
}

function apiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  return key;
}

export async function autocompletePlaces(
  input: string,
  sessionToken?: string,
  includedPrimaryTypes?: string[]
): Promise<PlaceSuggestion[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
    },
    body: JSON.stringify({ input, sessionToken, includedPrimaryTypes }),
  });

  if (!res.ok) {
    throw new Error("Places autocomplete failed");
  }

  const data = await res.json();
  const suggestions = data.suggestions ?? [];

  return suggestions
    .filter((s: any) => s.placePrediction)
    .map((s: any) => ({
      placeId: s.placePrediction.placeId,
      description: s.placePrediction.text.text,
    }));
}

export async function getPlaceDetails(
  placeId: string,
  sessionToken?: string
): Promise<PlaceDetails | null> {
  const params = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : "";

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}${params}`, {
    headers: {
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": "location,formattedAddress",
    },
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();

  if (!data.location) {
    return null;
  }

  return {
    lat: data.location.latitude,
    lng: data.location.longitude,
    description: data.formattedAddress,
  };
}
