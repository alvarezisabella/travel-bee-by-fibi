export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeCity(city: string): Promise<GeocodeResult | null> {
  const query = encodeURIComponent(city);

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
    {
      headers: {
        "User-Agent": "travelbee", // REQUIRED by Nominatim
      },
    }
  );

  if (!res.ok) {
    throw new Error("Geocoding failed");
  }

  const data = await res.json();

  if (!data || data.length === 0) {
    return null;
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}