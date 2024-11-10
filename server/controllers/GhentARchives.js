import fs from 'fs';
const markers = JSON.parse(fs.readFileSync(new URL('../data/markers.json', import.meta.url)));


// Functie om alle markers op te halen
export const getAllMarkers = (req, res) => {
  res.json(markers);
};

// Haal een specifiek monument op
export const getMarkerById = (req, res) => {
  const { id } = req.params;
  const marker = markers.find(m => m.id === parseInt(id, 10));
  
  if (marker) {
      res.json(marker);
  } else {
      res.status(404).send({ error: 'Marker niet gevonden' });
  }
};