import {Feature, Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import {fromLonLat} from 'ol/proj';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Overlay from 'ol/Overlay';

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
  layers: [tileLayer],
  view: new View({
    center: startCoordinates,
    zoom: 15
  })
});

// Maak een overlay voor de popup
const overlay = new Overlay({
  element: document.getElementById('popup'),
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});
map.addOverlay(overlay);

// Functie om markers aan de kaart toe te voegen
function addMarkersToMap(markers) {
  const vectorSource = new VectorSource();

  markers.forEach(marker => {
    if (marker.coordinates && Array.isArray(marker.coordinates) && marker.coordinates.length === 2) {
      const feature = new Feature({
        geometry: new Point(fromLonLat(marker.coordinates)),
        name: marker.name,
        monumentId: marker.id // Zorg ervoor dat elk marker-object een unieke ID heeft
      });

      vectorSource.addFeature(feature);
    }
  });

  const markerLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      image: new Icon({
        src: 'https://openlayers.org/en/latest/examples/data/icon.png',
        scale: 1
      })
    })
  });

  map.addLayer(markerLayer);

  // Klik-event toevoegen voor markers
  map.on('singleclick', function (event) {
    map.forEachFeatureAtPixel(event.pixel, function (feature) {
      const monumentId = feature.get('monumentId');
      showMarkerInfo(monumentId, event.coordinate);
    });
  });
}


// Functie om markerinformatie te tonen in de popup
async function showMarkerInfo(monumentId, coordinate) {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/ghentarchives/markers/${monumentId}`);
    const monumentData = await response.json();

    const content = `
      <strong>${monumentData.name}</strong><br>
      <img src="${monumentData.image}" alt="${monumentData.name}" style="width: 100px; height: auto;"><br>
      <p>${monumentData.description}</p>
      <a href="/ar/${monumentId}" target="_blank">Bekijk in AR</a>
    `;

    document.getElementById('popup-content').innerHTML = content;
    overlay.setPosition(coordinate);
  } catch (error) {
    console.error('Fout bij het ophalen van monumentinformatie:', error);
  }
}

// Popup sluiten
document.getElementById('popup-closer').onclick = function () {
  overlay.setPosition(undefined);
  return false; // Hiermee voorkom je de standaard actie van de link
};

// Fetch markers van de server
fetchMarkers();

async function fetchMarkers() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/ghentarchives/markers');
    const markers = await response.json();
    addMarkersToMap(markers);
  } catch (error) {
    console.error('Fout bij het ophalen van markers:', error);
  }
}

// SPARQL query to fetch buildings/monuments in Ghent
const sparqlQuery = `
  SELECT ?item ?itemLabel ?coordinate ?image WHERE {
    ?item wdt:P31 wd:Q41176;                     # Instance of "building"
          wdt:P131 wd:Q1296;                     # Located in Ghent (Q1296)
          wdt:P625 ?coordinate.                  # Has coordinates
    OPTIONAL { ?item wdt:P18 ?image. }           # Optional image
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
  }
  LIMIT 20
`;

const endpointUrl = 'https://query.wikidata.org/sparql';
const url = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}`;

// Fetch the data directly from the client
fetch(url, {
  headers: {
    'Accept': 'application/sparql-results+json',
  },
})
  .then(response => response.json())
  .then(data => {
    // Process the data as needed
    const buildings = data.results.bindings;
    console.log('Fetched Ghent buildings:', buildings);
    // Display or manipulate the buildings data
  })
  .catch(error => {
    console.error('Error fetching data from Wikidata:', error);
  });

