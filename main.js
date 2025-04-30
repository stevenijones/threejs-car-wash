import * as THREE from 'three';

const container = document.getElementById('scene-container');

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222233);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Simple ground
const groundGeo = new THREE.PlaneGeometry(40, 40);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// --- Car Model ---
function createCar() {
    const car = new THREE.Group();
    // Body
    const bodyGeo = new THREE.BoxGeometry(2, 0.6, 1);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    car.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1, 0.5, 0.9);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0.2, 0.9, 0);
    car.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    for (let x of [-0.7, 0.7]) {
        for (let z of [-0.4, 0.4]) {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.22, z);
            car.add(wheel);
        }
    }
    return car;
}

// Car queue and movement
const car = createCar();
scene.add(car);

const queueStartZ = 10; // Where the car starts (queue)
const washEntryZ = 0;   // Where the car enters the wash
car.position.set(0, 0, queueStartZ);

let carState = 'queue'; // 'queue', 'moving', 'in-wash'
let carTimer = 0;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Car movement logic
    if (carState === 'queue') {
        carTimer += 1;
        if (carTimer > 60) { // Wait ~1 second
            carState = 'moving';
        }
    } else if (carState === 'moving') {
        if (car.position.z > washEntryZ) {
            car.position.z -= 0.08; // Move forward
        } else {
            car.position.z = washEntryZ;
            carState = 'in-wash';
        }
    }
    renderer.render(scene, camera);
}

animate();

// Responsive resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
