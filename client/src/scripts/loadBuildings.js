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

// Fetch the data from Wikidata and add markers to the map
async function fetchAndAddMarkers() {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/sparql-results+json',
      },
    });
    const data = await response.json();
    const markers = data.results.bindings.map(binding => {
      const coordinates = binding.coordinate.value.match(/Point\(([^ ]+) ([^ ]+)\)/);
      return {
        id: binding.item.value.split('/').pop(), // Extract ID from URI
        name: binding.itemLabel.value,
        coordinates: coordinates ? [parseFloat(coordinates[1]), parseFloat(coordinates[2])] : null,
        image: binding.image ? binding.image.value : null
      };
    });

    addMarkersToMap(markers);
  } catch (error) {
    console.error('Error fetching data from Wikidata:', error);
  }
}

// Function to add markers to the map
function addMarkersToMap(markers) {
  const vectorSource = new VectorSource();

  markers.forEach(marker => {
    if (marker.coordinates && Array.isArray(marker.coordinates) && marker.coordinates.length === 2) {
      const feature = new Feature({
        geometry: new Point(fromLonLat(marker.coordinates)),
        name: marker.name,
        monumentId: marker.id // Ensure each marker has a unique ID
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

  // Add click event for markers
  map.on('singleclick', function (event) {
    map.forEachFeatureAtPixel(event.pixel, function (feature) {
      const monumentId = feature.get('monumentId');
      showMarkerInfo(monumentId, event.coordinate);
    });
  });
}

async function showMarkerInfo(monumentId, coordinate) {
  try {
    // SPARQL query to fetch name, image, and description with Dutch and English preference
    const sparqlQuery = `
      SELECT ?itemLabel ?image ?description WHERE {
        wd:${monumentId} rdfs:label ?itemLabel.
        OPTIONAL { wd:${monumentId} wdt:P18 ?image. }
        OPTIONAL {
          wd:${monumentId} schema:description ?description.
          FILTER(LANG(?description) = "nl" || LANG(?description) = "en")
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[nl, en]". }
      }
    `;

    // Endpoint URL for the Wikidata SPARQL endpoint
    const endpointUrl = 'https://query.wikidata.org/sparql';
    const url = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}`;

    // Fetch the data from Wikidata
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/sparql-results+json',
      },
    });
    const data = await response.json();

    // Extract the label (name), description, and image from the response
    const monumentData = data.results.bindings[0];
    const name = monumentData ? monumentData.itemLabel.value : 'Unknown Monument';

    // Use Dutch first for description, then English, if available
    let description = monumentData && monumentData.description ? monumentData.description.value : 'No description available.';

    const imageUrl = monumentData && monumentData.image ? monumentData.image.value : 'default-image-url.jpg';

    // Create the image click handler to open a larger view of the image
    const imageClickHandler = () => {
      window.open(imageUrl, '_blank');
    };

    // Create the popup content
    const content = `
      <strong>${name}</strong><br>
      <p>${description}</p><br>
      <img src="${imageUrl}" alt="${name}" style="width: 100px; height: auto; cursor: pointer;" onclick="(${imageClickHandler.toString()})()"><br>
      <p>Click the link to view more information or explore in AR.</p>
      <a href="/ar/${monumentId}" target="_blank">View in AR</a>
    `;

    // Update the popup content and show it at the clicked coordinate
    document.getElementById('popup-content').innerHTML = content;
    overlay.setPosition(coordinate);
  } catch (error) {
    console.error('Error fetching monument information:', error);
  }
}








// Close the popup
document.getElementById('popup-closer').onclick = function () {
  overlay.setPosition(undefined);
  return false;
};

// Run fetchAndAddMarkers to get data and display it on the map
fetchAndAddMarkers();
