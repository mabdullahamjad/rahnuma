// OpenStreetMap Nominatim proxy. It keeps map lookups server-side and avoids
// exposing any provider credentials in the browser.
export default async function handler(request, response) {
  try {
    const { q, lat, lng } = request.query;
    const url = q
      ? `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=pk&q=${encodeURIComponent(q)}`
      : `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const result = await fetch(url, { headers: { 'User-Agent': 'Rahnuma transit project/1.0 (student project)' } });
    if (!result.ok) throw new Error('OpenStreetMap lookup failed.');
    const data = await result.json();
    const place = Array.isArray(data) ? data[0] : data;
    let nearbyStops = [];
    if (lat && lng) {
      const overpassQuery = `[out:json][timeout:10];(node(around:3000,${lat},${lng})[public_transport=platform];node(around:3000,${lat},${lng})[highway=bus_stop];);out body 30;`;
      const overpass = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Rahnuma transit project/1.0 (student project)' },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });
      if (overpass.ok) {
        const stops = await overpass.json();
        nearbyStops = (stops.elements ?? []).filter((item) => item.tags?.name).map((item) => ({ name: item.tags.name, lat: item.lat, lng: item.lon }));
      }
    }
    return response.status(200).json({
      name: place?.display_name ?? null,
      lat: place?.lat ? Number(place.lat) : null,
      lng: place?.lon ? Number(place.lon) : null,
      nearbyStops,
    });
  } catch (error) {
    return response.status(502).json({ error: error instanceof Error ? error.message : 'Place lookup failed.' });
  }
}
