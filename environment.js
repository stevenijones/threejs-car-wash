import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { log } from './ui.js';

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
export let controls;

export const stepCubes = [];
export const stepPositions = [];
export const queueSpots = [];

export function initEnvironment(container) {
    // Scene setup
    scene.background = new THREE.Color(0x333344);
    
    // Camera setup
    camera.position.set(0, 12, 25);
    
    // Renderer setup
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Controls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 15;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.target.set(4, 0, 0);
    controls.update();

    setupLighting();
    setupGround();
    setupCarWash();
    setupLabels();
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemiLight);
}

function setupGround() {
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
}

function setupQueueSpots() {
    const spotWidth = 3;  // Wider than car
    const spotDepth = 2;  // Deeper than car
    const spotMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });

    for (let i = 0; i < 5; i++) {
        const spotGeo = new THREE.PlaneGeometry(spotWidth, spotDepth);
        const spot = new THREE.Mesh(spotGeo, spotMaterial);
        spot.rotation.x = -Math.PI / 2;
        spot.position.set(-3.5 - (i * (spotWidth + 0.2)), 0.5, 0);  // Slightly above ground
        scene.add(spot);
        queueSpots.push({
            mesh: spot,
            position: spot.position.x,
            isOccupied: false
        });
    }
}

function setupCarWash() {
    // Add queue spots before other elements
    setupQueueSpots();

    // Queue area marking
    const queueAreaGeo = new THREE.PlaneGeometry(20, 10);
    const queueAreaMat = new THREE.MeshStandardMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const queueArea = new THREE.Mesh(queueAreaGeo, queueAreaMat);
    queueArea.rotation.x = -Math.PI / 2;
    queueArea.position.set(-10.5, 0.01, 0);
    scene.add(queueArea);

    // Car wash area
    const washAreaGeo = new THREE.PlaneGeometry(12, 10);
    const washAreaMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const washArea = new THREE.Mesh(washAreaGeo, washAreaMat);
    washArea.rotation.x = -Math.PI / 2;
    washArea.position.set(6, 0.01, 0);
    scene.add(washArea);

    // Wash stations
    const stepWidth = 2.5;
    const stepHeight = 2;
    const stepDepth = 2;
    const stepSpacing = 3.5;
    const stepY = stepHeight / 2;

    const stepMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x33aaff, transparent: true, opacity: 0.4 }), // Wash
        new THREE.MeshStandardMaterial({ color: 0xffe066, transparent: true, opacity: 0.4 }), // Dry
        new THREE.MeshStandardMaterial({ color: 0xff66cc, transparent: true, opacity: 0.4 })  // Wax
    ];

    for (let i = 0; i < 3; i++) {
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth),
            stepMaterials[i]
        );
        cube.position.set((i * stepSpacing) + stepWidth, stepY, 0);
        scene.add(cube);
        stepCubes.push(cube);
        stepPositions.push(cube.position.x);
    }
}

function setupLabels() {
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Queue spot numbers
        queueSpots.forEach((spot, index) => {
            addFloorText(font, (index + 1).toString(), spot.position, 0.3);
        });
        
        // Floor labels
        addFloorText(font, 'QUEUE HERE', -1, 0.4);
        addFloorText(font, 'CAR WASH', 6, 0.6);
        
        // Station labels
        const stations = ['WASH', 'DRY', 'WAX'];
        stations.forEach((label, i) => {
            addStationLabel(font, label, i);
        });
    });
}

function addFloorText(font, text, x, size) {
    const geometry = new TextGeometry(text, {
        font: font,
        size: size,
        height: 0
    });
    geometry.computeBoundingBox();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    mesh.rotation.x = -Math.PI / 2;
    
    // Special handling for queue spot numbers
    if (text.match(/^[1-5]$/)) {
        mesh.position.set(x, 0.2, 1);  // Position number at front of spot
    } else if (text === 'QUEUE HERE') {
        mesh.rotation.z = -Math.PI / 2;
        mesh.position.set(x, 0.2, -1.75); //geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    } else if (text === 'CAR WASH') {
        mesh.position.set(x-2, 0.2, 2.5); //geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    } else {
        mesh.position.set(x - (geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2, 0.02, -1.5);
    }
    scene.add(mesh);
}

function addStationLabel(font, text, index) {
    const geometry = new TextGeometry(text, {
        font: font,
        size: 0.3,
        height: 0.05
    });
    geometry.computeBoundingBox();
    const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    mesh.position.set(
        stepCubes[index].position.x - width/2,
        2.3,
        0
    );
    scene.add(mesh);
}

// Handle window resizing
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
});
