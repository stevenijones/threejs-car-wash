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

// Car colors palette
const carColors = [
    0xff0000, // Red
    0x00ff00, // Green
    0x0000ff, // Blue
    0xffff00, // Yellow
    0xff00ff, // Magenta
    0x00ffff, // Cyan
    0xff8800, // Orange
    0x8800ff, // Purple
    0x00ff88, // Mint
    0xff0088  // Pink
];

// --- Car Model ---
function createCar(color) {
    const car = new THREE.Group();
    // Body
    const bodyGeo = new THREE.BoxGeometry(2, 0.6, 1);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color });
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

const cars = [];
const carSpawnInterval = 300; // Spawn a car every 5 seconds (assuming ~60fps)
let carSpawnTimer = 0;

function spawnCar() {
    // Pick a random color from our palette
    const randomColor = carColors[Math.floor(Math.random() * carColors.length)];
    const car = createCar(randomColor);
    car.rotation.y = -Math.PI * 1; // Rotate so the car faces positive X (right, 270 degrees)
    scene.add(car);

    const carObj = {
        mesh: car,
        state: 'queue',
        timer: 0,
        currentStep: 0,
        visible: true
    };

    // Car comes in from the left (X axis)
    const queueStartX = -10; // Start off-screen to the left
    const carZ = 0;          // Z position for the car wash entry
    car.position.set(queueStartX, 0, carZ);

    cars.push(carObj);
}

// Car wash step cubes (wash, dry, wax)
const stepWidth = 2.5;
const stepHeight = 2;
const stepDepth = 2;
const stepSpacing = 3.5;
const stepY = stepHeight / 2;

const stepMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x33aaff, transparent: true, opacity: 0.4 }), // Wash (blue)
    new THREE.MeshStandardMaterial({ color: 0xffe066, transparent: true, opacity: 0.4 }), // Dry (yellow)
    new THREE.MeshStandardMaterial({ color: 0xff66cc, transparent: true, opacity: 0.4 })  // Wax (pink)
];

const stepCubes = [];
for (let i = 0; i < 3; i++) {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth),
        stepMaterials[i]
    );
    cube.position.set((i * stepSpacing) + stepWidth, stepY, 0);
    scene.add(cube);
    stepCubes.push(cube);
}

// Step positions (center of each cube)
const stepPositions = [
    stepCubes[0].position.x,
    stepCubes[1].position.x,
    stepCubes[2].position.x
];

// Step durations in frames (assuming ~60fps)
const stepDurations = [300, 240, 180]; // 5s, 4s, 3s

function animate() {
    requestAnimationFrame(animate);

    // Spawn new cars at interval
    carSpawnTimer++;
    if (carSpawnTimer >= carSpawnInterval) {
        spawnCar();
        carSpawnTimer = 0;
    }

    // Update all cars
    for (let carObj of cars) {
        const car = carObj.mesh;
        if (!carObj.visible) continue;

        if (carObj.state === 'queue') {
            carObj.timer++;
            if (carObj.timer > 60) {
                carObj.state = 'moving';
            }
        } else if (carObj.state === 'moving') {
            const targetX = stepPositions[0];
            if (car.position.x < targetX) {
                car.position.x += 0.08;
            } else {
                car.position.x = targetX;
                carObj.state = 'step1';
                carObj.timer = 0;
                carObj.currentStep = 0;
            }
        } else if (carObj.state.startsWith('step')) {
            carObj.timer++;
            const stepIdx = carObj.currentStep;
            if (carObj.timer > stepDurations[stepIdx]) {
                if (stepIdx < 2) {
                    carObj.state = 'moveToStep' + (stepIdx + 2);
                } else {
                    carObj.state = 'done';
                }
                carObj.timer = 0;
            }
        } else if (carObj.state.startsWith('moveToStep')) {
            const nextStep = parseInt(carObj.state.replace('moveToStep', '')) - 1;
            const targetX = stepPositions[nextStep];
            if (car.position.x < targetX) {
                car.position.x += 0.08;
            } else {
                car.position.x = targetX;
                carObj.state = 'step' + (nextStep + 1);
                carObj.timer = 0;
                carObj.currentStep = nextStep;
            }
        } else if (carObj.state === 'done') {
            car.position.x += 0.12;
            if (car.position.x > stepPositions[2] + 10) {
                car.visible = false;
                carObj.visible = false;
            }
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
