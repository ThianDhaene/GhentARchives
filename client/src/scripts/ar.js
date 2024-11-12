import * as THREE from 'https://unpkg.com/three@0.151.3/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.151.3/examples/jsm/webxr/ARButton.js';

const apiUrl = "https://ghentarchivesapi.thiandhaene.ikdoeict.be"

// Parameters ophalen uit de URL
const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name') || 'Onbekend Monument';

// Haal de image URL parameter op
let imageUrl = urlParams.get('image');
console.log('Originele imageUrl:', imageUrl);

// Bijgewerkte async functie om de uiteindelijke URL te krijgen
async function getFinalUrlFromApi(inputUrl) {
  try {
    const response = await fetch(`${apiUrl}/unshorten?targetUrl=${encodeURIComponent(inputUrl)}`);
    const data = await response.json();
    console.log('Uiteindelijke URL:', data.finalUrl);
    return data.finalUrl || inputUrl;
  } catch (error) {
    console.error('Fout bij het ophalen van de uiteindelijke URL:', error);
    return inputUrl;
  }
}

async function init() {
  // Haal de uiteindelijke URL op en laad de texture
  imageUrl = await getFinalUrlFromApi(imageUrl);
  console.log('Opgeloste imageUrl:', imageUrl);

  // Stel de titel van het monument in
  document.getElementById('name').textContent = name;

  // Three.js setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Voeg de AR-knop toe
  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  // Maak een eenvoudig vlak om de afbeelding op te projecteren
  const textureLoader = new THREE.TextureLoader();

  if (imageUrl) {
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const objectURL = URL.createObjectURL(blob);
        textureLoader.load(objectURL, (texture) => {
          const geometry = new THREE.PlaneGeometry(1, 1);
          const material = new THREE.MeshBasicMaterial({ map: texture });
          const plane = new THREE.Mesh(geometry, material);
          plane.position.set(0, 0, -1);
          scene.add(plane);
        });
      })
      .catch(err => {
        console.error('Fout bij het laden van de afbeelding:', err);
      });
  }

  // Animatie- en renderloop
  function animate() {
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }

  animate();

  // Responsief aanpassen van de renderer bij schermverandering
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

init();
