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
  LIMIT 200
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

// Define the image click handler function in the global scope
function openImageInNewTab(imageUrl) {
  window.open(imageUrl, '_blank');
}

async function showMarkerInfo(monumentId, coordinate) {
  try {
    // Uitgebreide SPARQL-query voor extra informatie
    const sparqlQuery = `
      SELECT ?itemLabel ?description ?image ?architectLabel ?constructionDate WHERE {
        wd:${monumentId} rdfs:label ?itemLabel.
        OPTIONAL { wd:${monumentId} schema:description ?description. }
        OPTIONAL { wd:${monumentId} wdt:P18 ?image. }
        OPTIONAL { wd:${monumentId} wdt:P84 ?architect. }
        OPTIONAL { 
          wd:${monumentId} p:P793 ?eventStatement.
          ?eventStatement ps:P793 wd:Q385378;
                         pq:P585 ?constructionDate.
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],nl,en". }
        FILTER(LANG(?itemLabel) IN ("nl", "en"))
        FILTER(LANG(?description) IN ("nl", "en"))
      }
    `;

    // Endpoint URL voor de Wikidata SPARQL-endpoint
    const endpointUrl = 'https://query.wikidata.org/sparql';
    const url = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}`;

    // Data ophalen van Wikidata
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/sparql-results+json',
      },
    });
    const data = await response.json();

    // Gegevens uit de respons halen
    const monumentData = data.results.bindings[0];
    const name = monumentData ? monumentData.itemLabel.value : 'Onbekend monument';
    const description = monumentData && monumentData.description ? monumentData.description.value : 'Geen beschrijving beschikbaar.';
    const imageUrl = monumentData && monumentData.image ? monumentData.image.value : null;
    const architect = monumentData && monumentData.architectLabel ? monumentData.architectLabel.value : null;
    const constructionDate = monumentData && monumentData.constructionDate ? monumentData.constructionDate.value.substring(0, 4) : null; // Alleen het jaar

    // Bouw de inhoud van de pop-up dynamisch op basis van beschikbare gegevens
    const imageContent = imageUrl
      ? `<img src="${imageUrl}" alt="${name}" class="popup-image" id="popup-image">`
      : '';
    const arButtonContent = imageUrl
      ? `<p><a href="/arpage/?name=${encodeURIComponent(name)}&image=${encodeURIComponent(imageUrl)}" class="ar-button" target="_blank">View in AR</a></p>`
      : '';
    const architectContent = architect
      ? `<p><strong>Architect:</strong> ${architect}</p>`
      : '';
    const constructionDateContent = constructionDate
      ? `<p><strong>Bouwjaar:</strong> ${constructionDate}</p>`
      : '';

    // Maak de pop-up-inhoud aan
    const content = `
      <div class="popup-content">
        <h2>${name}</h2>
        <p class="description">${description}</p>
        ${imageContent}
        ${architectContent}
        ${constructionDateContent}
        ${arButtonContent}
      </div>
    `;

    // Update de inhoud van de pop-up en toon deze bij de aangeklikte coördinaat
    document.getElementById('popup-content').innerHTML = content;
    overlay.setPosition(coordinate);

    // Voeg eventlistener toe aan de afbeelding om deze in een nieuw tabblad te openen, alleen als de afbeelding bestaat
    if (imageUrl) {
      const imageElement = document.getElementById('popup-image');
      imageElement.addEventListener('click', function() {
        openImageInNewTab(imageUrl);
      });
    }

  } catch (error) {
    console.error('Fout bij het ophalen van monumentinformatie:', error);
  }
}

// Sluit de pop-up
document.getElementById('popup-closer').onclick = function () {
  overlay.setPosition(undefined);
  return false;
};

// Roep fetchAndAddMarkers aan om gegevens op te halen en op de kaart weer te geven
fetchAndAddMarkers();


