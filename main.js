import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import './style.css';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// Variables
let yoyoMixer;
const screenSize = {
	width: window.innerWidth,
	height: window.innerHeight,
};

init();

function init() {
	const loadingManager = initLoadingManager();
	const canvas = document.querySelector('.webgl');
	const scene = initScene();
	const camera = initCamera();
	const renderer = initRenderer(canvas);
	const controls = initControls(camera, canvas);
	initLights(scene);
	initModels(scene, loadingManager);
	initText(scene);
	initFloor(scene);
	initWebXR(renderer, scene, camera);
	watchScreenResize(camera, renderer);
	animate(renderer, scene, camera, controls);
	// showGridHelper(scene); //For development only
}

function initLoadingManager() {
	const loadingManager = new THREE.LoadingManager(() => {
		const loadingScreen = document.getElementById('loading-screen');
		loadingScreen.classList.add('fade-out');
		//Remove CSS class from loading screen so the screen of the models can be draggable
		loadingScreen.addEventListener('transitionend', onLoadingScreenEnd);
	});
	function onLoadingScreenEnd(event) {
		event.target.remove();
	}

	return loadingManager;
}

function initScene() {
	return new THREE.Scene();
}

function initCamera() {
	const camera = new THREE.PerspectiveCamera(
		45,
		screenSize.width / screenSize.height,
		0.1,
		500
	);
	camera.position.set(30, 30, 60); // Set the initial positions
	return camera;
}

function initLights(scene) {
	// PointLight
	const light = new THREE.PointLight(0xffffff, 1, 100);
	light.position.set(10, 10, 10);
	scene.add(light);
	// DirectionalLight
	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(1, 1, 1);
	scene.add(directionalLight);
}

function initModels(scene, loadingManager) {
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
}

function initText(scene) {
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
}

function initFloor(scene) {
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
}

function initRenderer(canvas) {
	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(screenSize.width, screenSize.height);
	renderer.setPixelRatio(2); // pixels will be higher. Edge of the oject will seem more smoother
	renderer.xr.enabled = true;
	return renderer;
}

function initControls(camera, canvas) {
	const controls = new OrbitControls(camera, canvas);
	controls.maxPolarAngle = Math.PI / 2.5; // prevent from going below the ground
	controls.enableDamping = true;
	controls.enablePan = false;
	controls.enableZoom = true;
	controls.minDistance = 10;
	controls.maxDistance = 100;
	return controls;
}

function watchScreenResize(camera, renderer) {
	window.addEventListener('resize', () => {
		// Update screenSize
		screenSize.width = window.innerWidth;
		screenSize.height = window.innerHeight;
		// Update Camera
		camera.aspect = screenSize.width / screenSize.height;
		camera.updateProjectionMatrix();
		renderer.setSize(screenSize.width, screenSize.height);
	});
}

function initWebXR(renderer, scene, camera) {
	const cameraGroup = new THREE.Group();
	cameraGroup.position.set(5, 5, 25); //Set the initial VR Headset Position.
	//When the user turns on VR mode.
	renderer.xr.addEventListener('sessionstart', () => {
		scene.add(cameraGroup);
		cameraGroup.add(camera);
	});
	//When the user turns off VR mode.
	renderer.xr.addEventListener('sessionend', () => {
		scene.remove(cameraGroup);
		cameraGroup.remove(camera);
	});

	document.body.appendChild(VRButton.createButton(renderer));
}

function animate(renderer, scene, camera, controls) {
	const loop = () => {
		controls.update();
		if (yoyoMixer) {
			yoyoMixer.update(0.0167); /// Time delta (approximately 60 FPS)
		}
		renderer.render(scene, camera);
		renderer.setAnimationLoop(loop);
	};
	loop();
}

function showGridHelper(scene) {
	// For development. Adds visual grid and axis indicators
	const gridHelper = new THREE.GridHelper(200, 50);
	scene.add(gridHelper);
	const axesHelper = new THREE.AxesHelper(100);
	scene.add(axesHelper);
}
