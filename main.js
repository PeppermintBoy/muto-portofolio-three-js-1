import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import './style.css';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// Loading page
const loadingManager = new THREE.LoadingManager(() => {
	const loadingScreen = document.getElementById('loading-screen');
	loadingScreen.classList.add('fade-out');
	//Remove CSS class from loading screen so the screen of the models can be draggable
	loadingScreen.addEventListener('transitionend', onLoadingScreenEnd);
});

function onLoadingScreenEnd(event) {
	const element = event.target;
	element.remove();
}
// Scene
const scene = new THREE.Scene();

// For development. Adds visual grid and axis indicators
// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(gridHelper);
// const axesHelper = new THREE.AxesHelper(100);
// scene.add(axesHelper);

// Screen Size
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

// Camera
const camera = new THREE.PerspectiveCamera(
	45,
	sizes.width / sizes.height,
	0.1,
	500
);
// Set the initial positions
camera.position.set(30, 30, 60);
scene.add(camera);

// PointLight
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10, 10, 10);
light.intensity = 5;
scene.add(light);

// Add a global ambient light to brighten the entire scene
// const ambientLight = new THREE.AmbientLight(0xffffff, 1); // White light with full intensity
// scene.add(ambientLight);

// DirectionalLight
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light with full intensity
directionalLight.position.set(1, 1, 1); // Adjust the position as needed
scene.add(directionalLight);

// Add 3D Model
const modelLoader = new GLTFLoader(loadingManager);
// load aircraft
modelLoader.load(
	'./models/vintage_toy_airplane_2/scene.gltf',
	gltf => {
		gltf.scene.position.set(0, 0, 0);
		gltf.scene.scale.set(0.02, 0.02, 0.02);
		gltf.scene.visible = true; // Set visibility to true
		scene.add(gltf.scene);
	},
	undefined,
	function (error) {
		console.error('Error loading GLTF file', error);
	}
);

// load robot
modelLoader.load(
	'./models/baby_robot__3dcoat/scene.gltf',
	gltf => {
		// robotModel = gltf;
		gltf.scene.position.set(-5, 0, 10);
		gltf.scene.scale.set(0.05, 0.05, 0.05);
		gltf.scene.visible = true; // Set visibility to true
		scene.add(gltf.scene);
	},
	undefined,
	function (error) {
		console.error('Error loading GLTF file', error);
	}
);

// Load Yoyo
let yoyoMixer;
modelLoader.load(
	'./avaturn/yoyo_laydown.glb',
	glb => {
		// robotModel = gltf;
		glb.scene.position.set(5, 0, 5);
		glb.scene.rotateY(0.5);
		glb.scene.scale.set(10, 10, 10);
		glb.scene.visible = true; // Set visibility to true
		scene.add(glb.scene);

		// Add yoyo's animation
		const animations = glb.animations;
		yoyoMixer = new THREE.AnimationMixer(glb.scene);
		if (animations && animations.length > 0) {
			for (let i = 0; i < animations.length; i++) {
				const animation = animations[i];
				yoyoMixer.clipAction(animation).play();
			}
		}
	},
	undefined,
	function (error) {
		console.error('Error loading YOYO GLB file', error);
	}
);

// Font Loader
const fontLoader = new FontLoader();
fontLoader.load('../fonts/Oswald_Medium_Regular.json', font => {
	// Create a text geometry for the words
	const textGeometry = new TextGeometry('Nathan Muto', {
		font: font, // Specify the font for the text
		size: 1.2, // Adjust the size of the text
		height: 0.1, // Adjust the thickness of the text
	});

	// Create a material for the text
	const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
	// Create a mesh using the geometry and material
	const textMesh = new THREE.Mesh(textGeometry, textMaterial);
	// Position the text on the floor
	textMesh.position.set(8, 0, 6); // Adjust the position as needed
	// textMesh.rotateX(-Math.PI / 2);
	// Add the text mesh to the scene
	scene.add(textMesh);
});

// Create a reflective floor
const geometry = new THREE.CircleGeometry(40, 64);
const groundMirror = new Reflector(geometry, {
	clipBias: 0.003,
	textureWidth: window.innerWidth * window.devicePixelRatio,
	textureHeight: window.innerHeight * window.devicePixelRatio,
	color: 0x889999,
});
groundMirror.position.y = -0.1;
groundMirror.rotateX(-Math.PI / 2);
groundMirror.material.envMapIntensity = 1;
scene.add(groundMirror);

//  Renderer (most important part. This is where all the magics come alive)
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
// pixels will be higher. Edge of the oject will seem more smoother
renderer.setPixelRatio(2);
renderer.render(scene, camera);

// Controls
const controls = new OrbitControls(camera, canvas);
// dont go below the ground
controls.maxPolarAngle = Math.PI / 2.5;
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = true;
controls.minDistance = 10;
controls.maxDistance = 100;

// Resize
window.addEventListener('resize', () => {
	// Update Sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;
	// Update Camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();
	renderer.setSize(sizes.width, sizes.height);
});

// WebXR settings
renderer.xr.enabled = true;
const cameraGroup = new THREE.Group();
// Set the initial VR Headset Position.
cameraGroup.position.set(5, 5, 25);
//When user turn on the VR mode.
const onVRSessionStart = () => {
	scene.add(cameraGroup);
	cameraGroup.add(camera);
};
//When user turn off the VR mode.
const onVRSessionEnd = () => {
	scene.remove(cameraGroup);
	cameraGroup.remove(camera);
};
renderer.xr.addEventListener('sessionstart', onVRSessionStart);
renderer.xr.addEventListener('sessionend', onVRSessionEnd);

document.body.appendChild(VRButton.createButton(renderer)); //Create "ENTER VR" button

// AnimateLoop
const animate = () => {
	// Object will move
	// mesh.position.x += 0.2;
	controls.update();
	if (yoyoMixer) {
		yoyoMixer.update(0.0167); // Time delta (approximately 60 FPS)
	}
	renderer.render(scene, camera);
	renderer.setAnimationLoop(animate);
};
animate();
