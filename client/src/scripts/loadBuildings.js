// import './style.css';
import {Feature, Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import {fromLonLat} from 'ol/proj';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

const key = "6ROUEeRsMFSPYaT7sIk9";

const tileLayer = new TileLayer({
  source: new XYZ({
    url: "https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=" + key,
    tileSize: 500,
  })
});

const startCoordinates = fromLonLat([3.721485428781186, 51.056876330109816]);

const map = new Map({
  target: 'map',
  layers: [
    tileLayer,
  ],
  view: new View({
    center: startCoordinates,
    zoom: 14
  })
});

// Ophalen van marker data van de server
async function fetchMarkers() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/ghentarchives/markers');
    const markers = await response.json();
    addMarkersToMap(markers);
  } catch (error) {
    console.error('Fout bij het ophalen van markers:', error);
  }
}

// Functie om markers aan de kaart toe te voegen
function addMarkersToMap(markers) {
  // Maak een VectorSource aan om alle features op te slaan
  const vectorSource = new VectorSource();

  markers.forEach(marker => {
    console.log(marker);
    // Controleer of marker de juiste structuur heeft
    if (marker.coordinates && Array.isArray(marker.coordinates) && marker.coordinates.length === 2) {
      const feature = new Feature({
        geometry: new Point(fromLonLat(marker.coordinates)),
        name: marker.name
      });

      vectorSource.addFeature(feature);
    } else {
      console.error('Marker heeft een ongeldige structuur:', marker);
    }
  });

  // Maak een VectorLayer aan en voeg de vectorSource toe
  const markerLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      image: new Icon({
        src: 'https://openlayers.org/en/latest/examples/data/icon.png',
        scale: 0.8
      })
    })
  });

  // Voeg de markerlaag toe aan de kaart
  map.addLayer(markerLayer);
}

fetchMarkers();
