import * as THREE from 'https://unpkg.com/three@0.151.3/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.151.3/examples/jsm/webxr/ARButton.js';

// Parameters ophalen uit de URL
const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name') || 'Onbekend Monument';
// let imageUrl = urlParams.get('image');
let imageUrl = "https://upload.wikimedia.org/wikipedia/commons/4/40/Gent_Rabot_1.JPG";
console.log(imageUrl);

// Zorg ervoor dat de afbeelding URL via HTTPS gaat
if (imageUrl && imageUrl.startsWith('http://')) {
  imageUrl = imageUrl.replace('http://', 'https://');
  console.log('URL aangepast naar HTTPS:', imageUrl);
}

// Titel van het monument instellen
document.getElementById('name').textContent = name;

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// AR Button toevoegen
document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

// Een eenvoudig vlak maken om de afbeelding op te projecteren
const textureLoader = new THREE.TextureLoader();

if (imageUrl) {
    // Fetch de afbeelding via fetch() en laad de afbeelding via TextureLoader
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

// Responsive aanpassen van de renderer bij schermverandering
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
