import * as THREE from 'three';
import { scene, camera, renderer, controls, stepCubes, stepPositions, initEnvironment } from './environment.js';
import { updateCarMovements, updateQueuePositions, updateSpawnTimer, spawnCar, cars, stepsOccupied } from './process.js';
import { isAnimating, updateSimulationTime, log } from './ui.js';

// Initialize the scene
const container = document.getElementById('scene-container');
initEnvironment(container);

// Animation state
let lastTime = 0;
let frameCount = 0;

// Spawn first car
spawnCar();

// Animation loop
function animate(currentTime) {
    if (!isAnimating) return;
    requestAnimationFrame(animate);
    
    try {
        frameCount++;
        if (frameCount % 60 === 0) {
            const queuedCars = cars.filter(car => car.state === 'queue');
            log(`Queue size: ${queuedCars.length}, Steps occupied: ${stepsOccupied.join(',')}`);
        }

        // Calculate delta time
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // Update simulation
        updateSimulationTime(currentTime);
        controls.update();
        updateSpawnTimer();
        updateCarMovements(deltaTime, stepCubes, stepPositions);
        updateQueuePositions();

        // Render
        renderer.render(scene, camera);
    } catch (error) {
        log(`Animation error: ${error.message}`, 'error');
    }
}

// Start animation
animate(0);