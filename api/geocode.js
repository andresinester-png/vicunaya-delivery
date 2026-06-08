export default async function handler(req, res) {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: 'address requerido' });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.VITE_GOOGLE_PLACES_API_KEY}`
  );
  const data = await response.json();
  
  if (data.results?.[0]) {
    const { lat, lng } = data.results[0].geometry.location;
    return res.status(200).json({ lat, lng });
  }
  res.status(200).json(null);
}
