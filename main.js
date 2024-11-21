import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './style.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GUI } from 'dat.gui';

gsap.registerPlugin(ScrollTrigger);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);


const orbitcontrols = new OrbitControls(camera, renderer.domElement);
orbitcontrols.enableDamping = true;
orbitcontrols.enablePan = false;
orbitcontrols.enableZoom = false;


const cubemapLoader = new THREE.CubeTextureLoader();
const cubemapTexture = cubemapLoader.load([
  'cubemap/px.jpg', 'cubemap/nx.jpg',
  'cubemap/py.jpg', 'cubemap/ny.jpg',
  'cubemap/pz.jpg', 'cubemap/nz.jpg',
]);
scene.environment = cubemapTexture;


const ambientLight = new THREE.AmbientLight(0xc1cdc1, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(0, 10, -2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);


const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -3;
ground.receiveShadow = true;
scene.add(ground);


const loader = new THREE.TextureLoader();
const texture360 = loader.load('textures/garage3.png');
const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture360, side: THREE.DoubleSide });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.rotation.y = Math.PI / 2;
scene.add(sphere);


let shoeModel = null;
let swearModel = null;
let lacesMaterial = null;
let isDragging = false;


const gltfLoader = new GLTFLoader();
gltfLoader.load('models/swearshoe.glb', (shoe) => {
  shoe.scene.traverse((node) => {
    if (node.isMesh) {
      if (node.name.toLowerCase().includes('laces')) {
        
        lacesMaterial = node.material;
      }
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  shoe.scene.scale.set(10, 10, 10);
  shoe.scene.position.set(0, 0, 0);
  shoe.scene.rotation.set(0, 1, 0);

  shoeModel = shoe.scene;
  scene.add(shoe.scene);

  
  addScrollAnimations(shoe.scene);

  
  addShoeControls();
});


gltfLoader.load('models/swear.glb', (swear) => {
  swear.scene.scale.set(20, 20, 20);
  swear.scene.position.set(0, 2, -3);
  swear.scene.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;

      
      node.material = new THREE.MeshMatcapMaterial({
        matcap: loader.load('textures/green.jpg'),
      });
    }
  });

  swearModel = swear.scene;
  scene.add(swear.scene); 
});


function addScrollAnimations(shoe) {
  gsap.to(shoe.rotation, {
    y: Math.PI * 1.5,
    scrollTrigger: {
      trigger: 'main',
      start: 'top+=100% bottom',
      end: 'top+=200% bottom',
      scrub: 1,
      markers: true,
    },
  });

  gsap.to(shoe.position, {
    x: 0,
    y: 0,
    z: 2,
    scrollTrigger: {
      trigger: 'section',
      start: 'top+=100% bottom',
      end: 'top+=180% bottom',
      scrub: 1,
      markers: true,
    },
  });
}


function addShoeControls() {
  const gui = new GUI();

  
  if (lacesMaterial) {
    const lacesFolder = gui.addFolder('Laces Controls');
    const lacesColor = { color: `#${lacesMaterial.color.getHexString()}` };

    lacesFolder.addColor(lacesColor, 'color').name('Color').onChange((value) => {
      lacesMaterial.color.set(value);
    });
    lacesFolder.open();
  }

  
  const lightFolder = gui.addFolder('Lighting');
  lightFolder.add(directionalLight, 'visible').name('Directional Light');
  lightFolder.add(directionalLight, 'intensity', 0, 5, 0.1).name('Intensity');
  lightFolder.open();
}


window.addEventListener('mousedown', (event) => {
  if (event.button === 0) {
    isDragging = true;
    orbitcontrols.enabled = false;
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  orbitcontrols.enabled = true;
});

window.addEventListener('mousemove', (event) => {
  if (isDragging && shoeModel) {
    const deltaX = event.movementX || 0;
    const deltaY = event.movementY || 0;

    shoeModel.rotation.y += deltaX * 0.01;
    shoeModel.rotation.x += deltaY * 0.01;
  }
});

camera.position.z = 5;
orbitcontrols.update();

function animate() {
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
