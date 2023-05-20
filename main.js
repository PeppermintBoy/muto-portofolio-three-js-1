import * as THREE from 'three';
import './style.css';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Scene
const scene = new THREE.Scene();

// Create our sphere
const geometry = new THREE.SphereGeometry(3, 64, 64);
const material = new THREE.MeshStandardMaterial({
	color: 'grey',
	// more shinier
	roughness: 0.2,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Size
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

// Light
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(30, 30, 20);
light.intensity = 5;
scene.add(light);

// Camera
const camera = new THREE.PerspectiveCamera(
	45,
	sizes.width / sizes.height,
	0.1,
	100
);
camera.position.z = 20;
scene.add(camera);

//  Renderer (most important part. This is where all the magics come alive)
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGL1Renderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
// pixels will be higher. Edge of the oject will seem more smoother
renderer.setPixelRatio(2);
renderer.render(scene, camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 5;

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

const loop = () => {
	// mesh.position.x += 0.2;
	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(loop);
};
loop();

// Timeline magic
const tl = gsap.timeline({ defaults: { duration: 1 } });
tl.fromTo(mesh.scale, { z: 0, x: 0, y: 0 }, { z: 2, x: 2, y: 2 });
tl.fromTo('nav', { y: '-100%' }, { y: '0%' });
tl.fromTo('.title', { opacity: 0 }, { opacity: 1 });

// Mouse animation Color
let mouseDown = false;
let rgb = [];
window.addEventListener('mousedown', () => (mouseDown = true));
window.addEventListener('mouseup', () => (mouseDown = false));

window.addEventListener('mousemove', e => {
	if (mouseDown) {
		rgb = [
			Math.round((e.pageX / sizes.width) * 255),
			Math.round((e.pageY / sizes.height) * 255),
			150,
		];
		// Lets animate
		// Needs to call Three.color in order to change THREE object color.
		let newColor = new THREE.Color(`rgb(${rgb.join(',')})`);
		gsap.to(mesh.material.color, {
			r: newColor.r,
			g: newColor.g,
			b: newColor.b,
		});
	}
});
