import * as THREE from 'three';
import './style.css';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import MeshReflectorMaterial from './MeshReflectorMaterial.js';

// Loading page
// const loadingManager = new THREE.LoadingManager(() => {
// 	const loadingScreen = document.getElementById('loading-screen');
// 	loadingScreen.classList.add('fade-out');
// });

// Scene
const scene = new THREE.Scene();

// Size
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
camera.position.x = 30;
camera.position.y = 30;
camera.position.z = 60;
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

// Create our sphere
// const geometry = new THREE.SphereGeometry(3, 64, 64);
// const material = new THREE.MeshStandardMaterial({
// 	color: 'grey',
// 	// more shinier
// 	roughness: 0.2,
// });
// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);

let aircraftModel;
let robotModel;
let yoyoMixer;

// Add 3D Model
const modelLoader = new GLTFLoader();
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
const renderer = new THREE.WebGL1Renderer({ canvas });
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
// controls.autoRotate = true;
// controls.autoRotateSpeed = 5;

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

// AnimateLoop
const animate = () => {
	// Object will move
	// mesh.position.x += 0.2;
	controls.update();
	if (yoyoMixer) {
		yoyoMixer.update(0.0167); // Time delta (approximately 60 FPS)
	}
	renderer.render(scene, camera);
	window.requestAnimationFrame(animate);
};
animate();

// Timeline magic
const tl = gsap.timeline({ defaults: { duration: 1 } });
// tl.fromTo(mesh.scale, { z: 0, x: 0, y: 0 }, { z: 2, x: 2, y: 2 });
// tl.fromTo('nav', { y: '-100%' }, { y: '0%' });
// tl.fromTo('.title', { opacity: 0 }, { opacity: 1 });

// Mouse animation Color
// let mouseDown = false;
// let rgb = [];
// window.addEventListener('mousedown', () => (mouseDown = true));
// window.addEventListener('mouseup', () => (mouseDown = false));

// window.addEventListener('mousemove', e => {
// 	if (mouseDown) {
// 		rgb = [
// 			Math.round((e.pageX / sizes.width) * 255),
// 			Math.round((e.pageY / sizes.height) * 255),
// 			150,
// 		];
// 		// Lets animate
// 		// Needs to call Three.color in order to change THREE object color.
// 		let newColor = new THREE.Color(`rgb(${rgb.join(',')})`);
// 		gsap.to(mesh.material.color, {
// 			r: newColor.r,
// 			g: newColor.g,
// 			b: newColor.b,
// 		});
// 	}
// });
