import { FoodPlace } from '../types';

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface RouteResult {
  coordinates: [number, number][]; // [lat, lng]
  distanceKm: number;
  durationMinutes: number;
  summary: string;
}

// Convert degrees to radians
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Calculate great-circle distance between two points in km (Haversine formula)
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate minimum distance from point P to line segment AB in km
function distancePointToSegmentKm(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  // Convert lat/lng to approximate equirectangular plane coordinates
  const meanLat = toRad((aLat + bLat + pLat) / 3);
  const kx = 111.32 * Math.cos(meanLat); // km per deg longitude
  const ky = 110.574; // km per deg latitude

  const px = pLng * kx;
  const py = pLat * ky;
  const ax = aLng * kx;
  const ay = aLat * ky;
  const bx = bLng * kx;
  const by = bLat * ky;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  // Projection parameter t
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * dx;
  const projY = ay + t * dy;

  return Math.hypot(px - projX, py - projY);
}

// Find minimum distance of a place to the polyline route
export function calculateMinDistanceToRouteKm(
  lat: number,
  lng: number,
  routeCoords: [number, number][]
): { minDistanceKm: number; closestSegmentIndex: number } {
  if (!routeCoords || routeCoords.length === 0) {
    return { minDistanceKm: 99999, closestSegmentIndex: 0 };
  }

  if (routeCoords.length === 1) {
    return {
      minDistanceKm: calculateDistanceKm(lat, lng, routeCoords[0][0], routeCoords[0][1]),
      closestSegmentIndex: 0,
    };
  }

  let minDistance = Infinity;
  let closestIndex = 0;

  // Check every segment along route
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const a = routeCoords[i];
    const b = routeCoords[i + 1];
    const d = distancePointToSegmentKm(lat, lng, a[0], a[1], b[0], b[1]);
    if (d < minDistance) {
      minDistance = d;
      closestIndex = i;
    }
  }

  return {
    minDistanceKm: Math.round(minDistance * 10) / 10,
    closestSegmentIndex: closestIndex,
  };
}

// Filter and enrich food places along a route
export function getFoodPlacesAlongRoute(
  places: FoodPlace[],
  routeCoords: [number, number][],
  maxRadiusKm: number
): FoodPlace[] {
  if (!routeCoords || routeCoords.length === 0) {
    return places.map((p) => ({ ...p, distance_from_route_km: 0 }));
  }

  const enriched = places.map((place) => {
    const { minDistanceKm, closestSegmentIndex } = calculateMinDistanceToRouteKm(
      place.latitude,
      place.longitude,
      routeCoords
    );
    return {
      ...place,
      distance_from_route_km: minDistanceKm,
      order_along_route: closestSegmentIndex,
    };
  });

  // Strict filter by selected radius
  const strictlyWithin = enriched.filter(
    (place) => (place.distance_from_route_km ?? 999) <= maxRadiusKm
  );

  // Smart Adaptive Fallback:
  // If user selected a tight radius (e.g. 2 km or 5 km) and no spots are strictly within it,
  // or if zero spots matched, gracefully surface the closest culinary spots along this travel corridor
  if (strictlyWithin.length === 0) {
    const fallbackRadius = Math.max(maxRadiusKm * 2.5, 30);
    const nearby = enriched
      .filter((place) => (place.distance_from_route_km ?? 999) <= fallbackRadius)
      .sort((a, b) => (a.distance_from_route_km ?? 0) - (b.distance_from_route_km ?? 0))
      .slice(0, 10);

    if (nearby.length > 0) {
      return nearby.sort((a, b) => (a.order_along_route ?? 0) - (b.order_along_route ?? 0));
    }
  }

  return strictlyWithin.sort((a, b) => (a.order_along_route ?? 0) - (b.order_along_route ?? 0));
}

// Fetch Driving Route using OSRM with automatic fallback
export async function fetchDrivingRoute(
  origin: { lat: number; lng: number; name?: string },
  destination: { lat: number; lng: number; name?: string }
): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM returns GeoJSON coordinates in [lng, lat] format -> convert to [lat, lng] for Leaflet
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMinutes = Math.round(route.duration / 60);

        return {
          coordinates,
          distanceKm,
          durationMinutes,
          summary: `${distanceKm} km · perkiraan ${Math.floor(durationMinutes / 60)}j ${durationMinutes % 60}m`,
        };
      }
    }
  } catch (err) {
    console.warn('OSRM routing fetch failed or timed out, generating corridor polyline fallback.', err);
  }

  // Fallback: Generate curved realistic road-like waypoint polyline between points
  const pointsCount = 30;
  const coordinates: [number, number][] = [];
  const dist = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);

  for (let i = 0; i <= pointsCount; i++) {
    const frac = i / pointsCount;
    // Base linear interpolation
    let lat = origin.lat + (destination.lat - origin.lat) * frac;
    let lng = origin.lng + (destination.lng - origin.lng) * frac;

    // Introduce gentle curve mimicking highway terrain
    const curveOffset = Math.sin(frac * Math.PI) * 0.05;
    lat += curveOffset * (destination.lng > origin.lng ? 0.3 : -0.3);
    lng += curveOffset * 0.2;

    coordinates.push([lat, lng]);
  }

  const estimatedMinutes = Math.round((dist / 65) * 60); // assume 65 km/h avg highway speed

  return {
    coordinates,
    distanceKm: Math.round(dist * 1.15 * 10) / 10,
    durationMinutes: estimatedMinutes,
    summary: `${Math.round(dist * 1.15)} km · ~${Math.floor(estimatedMinutes / 60)}j ${estimatedMinutes % 60}m`,
  };
}
