export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

export interface PlaceDetails {
  lat: number;
  lng: number;
  description: string;
}

export interface PlaceSearchResult {
  id: string;
  title: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: string;
  category?: string;
  summary?: string;
  photoName?: string;
  websiteUri?: string;
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

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.primaryTypeDisplayName",
  "places.editorialSummary",
  "places.photos",
  "places.websiteUri",
].join(",");

// Text search returns price, rating, photo and address in a single call, and
// scopes results to the destination properly when the query names it.
// photoName is a resource id, not a URL. Serve it through /api/places/photo so
// the API key stays server side.
export async function searchPlacesByText(
  textQuery: string,
  includedType?: string,
  maxResultCount = 12
): Promise<PlaceSearchResult[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    },
    body: JSON.stringify({ textQuery, includedType, maxResultCount }),
  });

  if (!res.ok) {
    throw new Error(`Places text search failed (${res.status})`);
  }

  const data = await res.json();
  const places = data.places ?? [];

  return places
    .map((p: any) => ({
      id: p.id,
      title: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
      rating: p.rating,
      reviewCount: p.userRatingCount,
      priceLevel: p.priceLevel,
      category: p.primaryTypeDisplayName?.text,
      summary: p.editorialSummary?.text,
      photoName: p.photos?.[0]?.name,
      websiteUri: p.websiteUri,
    }))
    .filter((p: PlaceSearchResult) => p.title);
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
