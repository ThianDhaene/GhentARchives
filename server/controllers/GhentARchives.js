import markers from '../data/markers.json' assert { type: 'json' };


// Functie om alle markers op te halen
export const getAllMarkers = (req, res) => {
  res.json(markers);
};
