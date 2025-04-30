import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// Debug utilities
const debugPanel = document.getElementById('debug-panel');
const maxLogs = 20;
let logs = [];

function log(message, type = 'info') {
    console.log(message);
    logs.unshift({ message, type });
    if (logs.length > maxLogs) logs.pop();
    
    debugPanel.innerHTML = logs
        .map(log => `<p class="${log.type}">${log.type.toUpperCase()}: ${log.message}</p>`)
        .join('');
}

// Error handling
window.addEventListener('error', function(e) {
    log(e.error.message || 'Unknown error', 'error');
    console.error('Global error:', e.error);
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    log(`Promise error: ${e.reason}`, 'error');
});

log('Three.js Version: ' + THREE.REVISION);

// Initialize global constants
const queueStartX = -15; // Start further off-screen to the left
const carZ = 0;          // Z position for the car wash entry
const fontLoader = new FontLoader();

// Scene setup with enhanced visibility
log('Creating scene...');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333344); // Slightly lighter background
log('Scene created');

// Enhanced camera setup
const camera = new THREE.PerspectiveCamera(
    75, // Wider FOV for better visibility
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 12, 25);  // Move camera further back and up for better initial view
log('Camera position: ' + camera.position.toArray());

// Enhanced renderer setup
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
log('Renderer initialized');

const container = document.getElementById('scene-container');
container.appendChild(renderer.domElement);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false; // Disable panning
controls.minDistance = 15;  // Set minimum zoom distance
controls.maxDistance = 40;  // Set maximum zoom distance
controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent camera from going below ground
controls.target.set(4, 0, 0); // Look at the center of the car wash area
controls.update();

// Enhanced lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);  // Increased intensity
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);  // Increased intensity
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;  // Enable shadows
scene.add(dirLight);

// Add a hemisphere light for better ambient illumination
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemiLight);

// Ground with enhanced material
const groundGeo = new THREE.PlaneGeometry(50, 50);  // Larger ground
const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x888888,
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;  // Allow ground to receive shadows
scene.add(ground);

// Add floor markings
// Queue area marking
const queueAreaGeo = new THREE.PlaneGeometry(3, 15);
const queueAreaMat = new THREE.MeshStandardMaterial({ 
    color: 0xffff00,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
});
const queueArea = new THREE.Mesh(queueAreaGeo, queueAreaMat);
queueArea.rotation.x = -Math.PI / 2;
queueArea.position.set(queueStartX + 1.5, 0.01, 0); // Slightly above ground to prevent z-fighting
scene.add(queueArea);

// Car wash area marking (includes all three steps)
const washAreaGeo = new THREE.PlaneGeometry(12, 4);
const washAreaMat = new THREE.MeshStandardMaterial({ 
    color: 0x00ffff,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
});
const washArea = new THREE.Mesh(washAreaGeo, washAreaMat);
washArea.rotation.x = -Math.PI / 2;
washArea.position.set(6, 0.01, 0); // Centered on all three steps, slightly above ground
scene.add(washArea);

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
const stepLabels = ['WASH', 'DRY', 'WAX'];
for (let i = 0; i < 3; i++) {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth),
        stepMaterials[i]
    );
    cube.position.set((i * stepSpacing) + stepWidth, stepY, 0);
    scene.add(cube);
    stepCubes.push(cube);
}

// Add text for floor markings and cube labels
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const floorTextMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Queue area text
    const queueFloorGeo = new TextGeometry('QUEUE HERE', {
        font: font,
        size: 0.4,
        height: 0
    });
    queueFloorGeo.computeBoundingBox();
    const queueFloorWidth = queueFloorGeo.boundingBox.max.x - queueFloorGeo.boundingBox.min.x;
    const queueFloorText = new THREE.Mesh(queueFloorGeo, floorTextMat);
    queueFloorText.rotation.x = -Math.PI / 2;
    queueFloorText.rotation.z = Math.PI / 2;
    queueFloorText.position.set(queueStartX + 1.5, 0.02, queueFloorWidth/2);
    scene.add(queueFloorText);
    
    // Car wash area text
    const washFloorGeo = new TextGeometry('CAR WASH', {
        font: font,
        size: 0.6,
        height: 0
    });
    washFloorGeo.computeBoundingBox();
    const washFloorWidth = washFloorGeo.boundingBox.max.x - washFloorGeo.boundingBox.min.x;
    const washFloorText = new THREE.Mesh(washFloorGeo, floorTextMat);
    washFloorText.rotation.x = -Math.PI / 2;
    washFloorText.position.set(6 - washFloorWidth/2, 0.02, -1.5);
    scene.add(washFloorText);
    
    // Add labels above the cubes
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 3; i++) {
        const textGeometry = new TextGeometry(stepLabels[i], {
            font: font,
            size: 0.3,
            height: 0.05
        });
        
        // Center the text
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        
        const text = new THREE.Mesh(textGeometry, textMaterial);
        text.position.set(
            stepCubes[i].position.x - textWidth/2, // Center horizontally
            stepHeight + 0.3, // Position above the cube
            0 // Same Z as cube
        );
        scene.add(text);
    }
    
    // Add queue label
    const queueGeometry = new TextGeometry('QUEUE', {
        font: font,
        size: 0.3,
        height: 0.05
    });
    
    // Center the queue text
    queueGeometry.computeBoundingBox();
    const queueWidth = queueGeometry.boundingBox.max.x - queueGeometry.boundingBox.min.x;
    const queueText = new THREE.Mesh(queueGeometry, textMaterial);
    queueText.position.set(
        queueStartX + 1, // Slightly ahead of the queue start position
        stepHeight + 0.3, // Same height as other labels
        0 // Same Z as other labels
    );
    scene.add(queueText);
});

// --- Car Model ---
function createCar(color) {
    const car = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(2, 0.6, 1.2);
    const bodyMat = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 30
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    car.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1, 0.5, 0.9);
    const cabinMat = new THREE.MeshPhongMaterial({ 
        color: 0x222222,
        shininess: 40,
        transparent: true,
        opacity: 0.8
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0.2, 0.9, 0);
    cabin.castShadow = true;
    car.add(cabin);

    // Wheels with better detail
    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16);
    const wheelMat = new THREE.MeshPhongMaterial({ 
        color: 0x222222,
        shininess: 30
    });
    const wheelPositions = [
        { x: -0.7, z: 0.5 },
        { x: -0.7, z: -0.5 },
        { x: 0.7, z: 0.5 },
        { x: 0.7, z: -0.5 }
    ];    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;  // Changed from z to x rotation
        wheel.position.set(pos.x, 0.22, pos.z);
        wheel.castShadow = true;
        car.add(wheel);
    });

    return car;
}

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

// Car queue and movement
const cars = [];
const carSpawnInterval = 300; // Spawn a car every 5 seconds (assuming ~60fps)
let carSpawnTimer = 0;

// Step positions (center of each cube)
const stepPositions = [
    stepCubes[0].position.x,
    stepCubes[1].position.x,
    stepCubes[2].position.x
];

// Step durations in frames (assuming ~60fps)
const stepDurations = [300, 240, 180]; // 5s, 4s, 3s

// Track which steps are occupied
const stepsOccupied = [false, false, false];

// Spawn first car immediately
spawnCar();

function spawnCar() {
    try {
        const randomColor = carColors[Math.floor(Math.random() * carColors.length)];
        const car = createCar(randomColor);
        car.rotation.y = -Math.PI * 1;
        scene.add(car);

        const carObj = {
            mesh: car,
            state: 'queue',
            timer: 0,
            currentStep: 0,
            visible: true
        };

        car.position.set(queueStartX, 0, carZ);
        cars.push(carObj);
        log(`Car spawned at position (${queueStartX}, 0, ${carZ})`);
    } catch (error) {
        log(`Error spawning car: ${error.message}`, 'error');
    }
}

// Animation constants
const MOVE_SPEED = 0.05;
let lastTime = 0;
let frameCount = 0;

function animate(currentTime) {
    requestAnimationFrame(animate);

    try {
        frameCount++;
        if (frameCount % 60 === 0) { // Log every second
            log(`Active cars: ${cars.length}, Steps occupied: ${stepsOccupied.join(',')}`);
        }

        // Calculate delta time for smooth animation
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // Update controls
        controls.update();

        // Spawn new cars at interval
        carSpawnTimer++;
        if (carSpawnTimer >= carSpawnInterval && cars.length < 10) {  // Limit total cars
            spawnCar();
            carSpawnTimer = 0;
        }

        // Update all cars
        for (let i = cars.length - 1; i >= 0; i--) {
            const carObj = cars[i];
            if (!carObj || !carObj.mesh) {
                log('Invalid car object found', 'warn');
                continue;
            }

            const car = carObj.mesh;
            
            if (!carObj.visible) {
                scene.remove(car);
                cars.splice(i, 1);
                continue;
            }

            switch (carObj.state) {
                case 'queue':
                    carObj.timer++;
                    if (carObj.timer > 60) {
                        carObj.state = 'moving';
                        carObj.timer = 0;
                    }
                    break;

                case 'moving':
                    if (!stepsOccupied[0]) {
                        const targetX = stepPositions[0];
                        if (car.position.x < targetX) {
                            car.position.x += MOVE_SPEED * deltaTime;
                        } else {
                            car.position.x = targetX;
                            carObj.state = 'step1';
                            carObj.timer = 0;
                            carObj.currentStep = 0;
                            stepsOccupied[0] = true;
                            
                            // Visual feedback for entering washing stage
                            stepCubes[0].material.opacity = 0.6;
                        }
                    }
                    break;

                case 'step1':
                case 'step2':
                case 'step3':
                    carObj.timer++;
                    const stepIdx = parseInt(carObj.state.replace('step', '')) - 1;
                    
                    // Add visual feedback during the process
                    if (carObj.timer % 30 < 15) {  // Pulse effect
                        stepCubes[stepIdx].material.opacity = 0.6;
                    } else {
                        stepCubes[stepIdx].material.opacity = 0.4;
                    }

                    if (carObj.timer >= stepDurations[stepIdx]) {
                        if (stepIdx < 2 && !stepsOccupied[stepIdx + 1]) {
                            stepsOccupied[stepIdx] = false;
                            stepCubes[stepIdx].material.opacity = 0.4;
                            carObj.state = 'moveToStep' + (stepIdx + 2);
                            carObj.timer = 0;
                        } else if (stepIdx === 2) {
                            stepsOccupied[stepIdx] = false;
                            stepCubes[stepIdx].material.opacity = 0.4;
                            carObj.state = 'done';
                            carObj.timer = 0;
                        }
                    }
                    break;

                case 'moveToStep2':
                case 'moveToStep3':
                    const nextStep = parseInt(carObj.state.replace('moveToStep', '')) - 1;
                    const targetX = stepPositions[nextStep];
                    
                    if (car.position.x < targetX) {
                        car.position.x += MOVE_SPEED * deltaTime;
                    } else {
                        car.position.x = targetX;
                        carObj.state = 'step' + (nextStep + 1);
                        stepsOccupied[nextStep] = true;
                        carObj.timer = 0;
                        carObj.currentStep = nextStep;
                    }
                    break;

                case 'done':
                    car.position.x += MOVE_SPEED * 1.5 * deltaTime;
                    if (car.position.x > stepPositions[2] + 15) {
                        car.visible = false;
                        carObj.visible = false;
                    }
                    break;
            }
        }

        renderer.render(scene, camera);
    } catch (error) {
        log(`Animation error: ${error.message}`, 'error');
    }
}

// Start the animation loop
animate(0);

// Responsive resize with proper aspect ratio
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
});
