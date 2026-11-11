export interface PhotonSuggestion {
  id: string;
  name: string;
  street?: string;
  city?: string;
  state?: string; // provinsi
  country?: string;
  lat: number;
  lng: number;
  formattedLabel: string;
  subLabel?: string;
}

// Bounding box for Indonesia: minLon, minLat, maxLon, maxLat
// Approx 95.0°E, -11.0°S to 141.0°E, 6.0°N
const INDONESIA_BBOX = '95.0,-11.0,141.0,6.0';

export async function fetchPhotonSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<PhotonSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const encoded = encodeURIComponent(trimmed);
  // Using Photon API from Komoot with Indonesia bounding box bias
  const url = `https://photon.komoot.io/api/?q=${encoded}&limit=8&bbox=${INDONESIA_BBOX}&lang=en`;

  try {
    const res = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.features && Array.isArray(data.features)) {
        const results: PhotonSuggestion[] = [];

        for (const feature of data.features) {
          if (!feature.geometry || !feature.geometry.coordinates) continue;
          const [lng, lat] = feature.geometry.coordinates;
          const props = feature.properties || {};

          // Filter to Indonesia if country is present
          if (
            props.country &&
            props.country.toLowerCase() !== 'indonesia' &&
            props.countrycode &&
            props.countrycode.toLowerCase() !== 'id'
          ) {
            // Skip non-indonesian locations if explicitly tagged as another country
            continue;
          }

          const name = props.name || trimmed;
          const street = props.street;
          const city = props.city || props.district || props.county;
          const state = props.state;
          const country = props.country || 'Indonesia';

          // Format secondary details (Jalan, Kota, Provinsi)
          const subParts: string[] = [];
          if (street) subParts.push(street);
          if (city && city !== name) subParts.push(city);
          if (state && state !== name && state !== city) subParts.push(state);

          const formattedLabel = name;
          const subLabel = subParts.length > 0 ? subParts.join(', ') : (city || state || 'Indonesia');

          results.push({
            id: `${props.osm_id || Math.random()}-${lat}-${lng}`,
            name,
            street,
            city: city || name,
            state,
            country,
            lat,
            lng,
            formattedLabel,
            subLabel,
          });

          if (results.length >= 7) break; // max 5-7 suggestions
        }

        if (results.length > 0) {
          return results;
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return [];
    }
    console.warn('Photon API fetch notice, using fallback catalog if needed', err);
  }

  // Indonesian major cities fallback if offline or restricted
  const FALLBACK_CITIES: Array<{ name: string; city: string; state: string; lat: number; lng: number }> = [
    { name: 'Jakarta', city: 'Jakarta Pusat', state: 'DKI Jakarta', lat: -6.2088, lng: 106.8456 },
    { name: 'Bandung', city: 'Kota Bandung', state: 'Jawa Barat', lat: -6.9175, lng: 107.6191 },
    { name: 'Bogor', city: 'Kota Bogor', state: 'Jawa Barat', lat: -6.5971, lng: 106.806 },
    { name: 'Purwakarta', city: 'Kabupaten Purwakarta', state: 'Jawa Barat', lat: -6.5569, lng: 107.4433 },
    { name: 'Cirebon', city: 'Kota Cirebon', state: 'Jawa Barat', lat: -6.7063, lng: 108.557 },
    { name: 'Semarang', city: 'Kota Semarang', state: 'Jawa Tengah', lat: -6.9667, lng: 110.4167 },
    { name: 'Yogyakarta', city: 'Kota Yogyakarta', state: 'D.I. Yogyakarta', lat: -7.7956, lng: 110.3695 },
    { name: 'Surakarta (Solo)', city: 'Kota Surakarta', state: 'Jawa Tengah', lat: -7.5755, lng: 110.8243 },
    { name: 'Surabaya', city: 'Kota Surabaya', state: 'Jawa Timur', lat: -7.2575, lng: 112.7521 },
    { name: 'Malang', city: 'Kota Malang', state: 'Jawa Timur', lat: -7.9829, lng: 112.6308 },
    { name: 'Denpasar', city: 'Kota Denpasar', state: 'Bali', lat: -8.6705, lng: 115.2126 },
  ];

  const matchedFallback = FALLBACK_CITIES.filter((item) =>
    item.name.toLowerCase().includes(trimmed.toLowerCase()) ||
    item.city.toLowerCase().includes(trimmed.toLowerCase()) ||
    item.state.toLowerCase().includes(trimmed.toLowerCase())
  ).slice(0, 6);

  return matchedFallback.map((item) => ({
    id: `fb-${item.name}-${item.lat}`,
    name: item.name,
    city: item.city,
    state: item.state,
    lat: item.lat,
    lng: item.lng,
    formattedLabel: item.name,
    subLabel: `${item.city}, ${item.state}`,
  }));
}
