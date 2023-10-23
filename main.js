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
	// showGridHelper(scene); //For development only

	animate(renderer, scene, camera, controls);
}

function initLoadingManager() {
	const _loadingManager = new THREE.LoadingManager(() => {
		const _loadingScreen = document.getElementById('loading-screen');
		_loadingScreen.classList.add('fade-out');
		_loadingScreen.addEventListener('transitionend', event => {
			//Remove CSS class from loading screen so the screen of the models can be draggable
			event.target.remove();
		});
	});
	return _loadingManager;
}

function initScene() {
	return new THREE.Scene();
}

function initCamera() {
	const _camera = new THREE.PerspectiveCamera(
		45,
		screenSize.width / screenSize.height,
		0.1,
		500
	);
	_camera.position.set(30, 30, 60); // Set the initial positions
	return _camera;
}

function initLights(scene) {
	// PointLight
	const _light = new THREE.PointLight(0xffffff, 1, 100);
	_light.position.set(10, 10, 10);
	scene.add(_light);
	// DirectionalLight
	const _directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	_directionalLight.position.set(1, 1, 1);
	scene.add(_directionalLight);
}

function initModels(scene, loadingManager) {
	const _modelLoader = new GLTFLoader(loadingManager);
	// load aircraft
	_modelLoader.load(
		'./models/vintage_toy_airplane_2/scene.gltf',
		gltf => {
			gltf.scene.position.set(0, 0, 0);
			gltf.scene.scale.set(0.02, 0.02, 0.02);
			gltf.scene.visible = true;
			scene.add(gltf.scene);
		},
		undefined,
		function (error) {
			console.error('Error loading GLTF file', error);
		}
	);

	// load robot
	_modelLoader.load(
		'./models/baby_robot__3dcoat/scene.gltf',
		gltf => {
			gltf.scene.position.set(-5, 0, 10);
			gltf.scene.scale.set(0.05, 0.05, 0.05);
			gltf.scene.visible = true;
			scene.add(gltf.scene);
		},
		undefined,
		function (error) {
			console.error('Error loading GLTF file', error);
		}
	);

	// Load Yoyo
	_modelLoader.load(
		'./models//avaturn/yoyo_laydown.glb',
		glb => {
			glb.scene.position.set(5, 0, 5);
			glb.scene.rotateY(0.5);
			glb.scene.scale.set(10, 10, 10);
			glb.scene.visible = true;
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
	const _fontLoader = new FontLoader();
	_fontLoader.load('../fonts/Oswald_Medium_Regular.json', font => {
		const _textGeometry = new TextGeometry('Nathan Muto', {
			font: font, // Specify the font for the text
			size: 1.2, // Adjust the size of the text
			height: 0.1, // Adjust the thickness of the text
		});

		const _textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		const _textMesh = new THREE.Mesh(_textGeometry, _textMaterial);
		_textMesh.position.set(8, 0, 6); // Position the text on the floor
		scene.add(_textMesh);
	});
}

function initFloor(scene) {
	// Create a reflective floor
	const _geometry = new THREE.CircleGeometry(40, 64);
	const _groundMirror = new Reflector(_geometry, {
		clipBias: 0.003,
		textureWidth: window.innerWidth * window.devicePixelRatio,
		textureHeight: window.innerHeight * window.devicePixelRatio,
		color: 0x889999,
	});
	_groundMirror.position.y = -0.1;
	_groundMirror.rotateX(-Math.PI / 2);
	_groundMirror.material.envMapIntensity = 1;
	scene.add(_groundMirror);
}

function initRenderer(canvas) {
	const _renderer = new THREE.WebGLRenderer({ canvas });
	_renderer.setSize(screenSize.width, screenSize.height);
	_renderer.setPixelRatio(2); // pixels will be higher. Edge of the oject will seem more smoother
	_renderer.xr.enabled = true;
	return _renderer;
}

function initControls(camera, canvas) {
	const _controls = new OrbitControls(camera, canvas);
	_controls.maxPolarAngle = Math.PI / 2.5; // prevent from going below the ground
	_controls.enableDamping = true;
	_controls.enablePan = false;
	_controls.enableZoom = true;
	_controls.minDistance = 10;
	_controls.maxDistance = 100;
	return _controls;
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
	const _cameraGroup = new THREE.Group();
	_cameraGroup.position.set(5, 5, 25); //Set the initial VR Headset Position.

	// Create the "Enter VR" button
	const _enterVRButton = VRButton.createButton(renderer);
	document.body.appendChild(_enterVRButton);

	//When the user turns on VR mode.
	renderer.xr.addEventListener('sessionstart', () => {
		scene.add(_cameraGroup);
		_cameraGroup.add(camera);
	});
	//When the user turns off VR mode.
	renderer.xr.addEventListener('sessionend', () => {
		scene.remove(_cameraGroup);
		_cameraGroup.remove(camera);
	});
}

function animate(renderer, scene, camera, controls) {
	const _loop = () => {
		controls.update();
		if (yoyoMixer) {
			yoyoMixer.update(0.0167); /// Time delta (approximately 60 FPS)
		}
		renderer.render(scene, camera);
		renderer.setAnimationLoop(_loop);
	};
	_loop();
}

function showGridHelper(scene) {
	// For development. Adds visual grid and axis indicators
	const _gridHelper = new THREE.GridHelper(200, 50);
	scene.add(_gridHelper);
	const axesHelper = new THREE.AxesHelper(100);
	scene.add(axesHelper);
}
