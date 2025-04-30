import * as THREE from 'three';
import { scene, queueSpots } from './environment.js';
import { createCar, carColors } from './models.js';
import { log } from './ui.js';

// Constants
export const CAR_LENGTH = 2;
export const CAR_WIDTH = 1.2;
export const MIN_CAR_SPACING = 0.5;
export const QUEUE_START_X = -5;
export const QUEUE_SPACING = CAR_LENGTH + MIN_CAR_SPACING * 2;
export const MAX_QUEUE_SIZE = 5;
export const MOVE_SPEED = 0.05;

// State
export const cars = [];
export const stepsOccupied = [false, false, false];
export const stepDurations = [300, 240, 180]; // 5s, 4s, 3s
let carSpawnTimer = 0;
const carSpawnInterval = 180;
let nextCarId = 1; // Counter for unique car IDs

export function findAvailableQueueSpot(queueSpots) {
    // Find the last empty spot (FIFO queue)
    for (let i = queueSpots.length - 1; i >= 0; i--) {
        if (!queueSpots[i].isOccupied) {
            return i;
        }
    }
    return -1;  // No spots available
}

export function updateQueuePositions() {
    const queuedCars = cars.filter(car => car.state === 'queue');
    
    // Reset spot occupancy
    queueSpots.forEach(spot => spot.isOccupied = false);
    
    // Sort cars by position, from front to back
    queuedCars.sort((a, b) => b.mesh.position.x - a.mesh.position.x);
    
    // Assign cars to spots, starting from the front
    queuedCars.forEach((carObj, index) => {
        const targetSpot = queueSpots[index];
        if (targetSpot) {
            const distance = targetSpot.position - carObj.mesh.position.x;
            const POSITION_THRESHOLD = 0.1; // Increased threshold for position snapping
            
            if (Math.abs(distance) > POSITION_THRESHOLD) {
                // Move towards the target spot
                const moveSpeed = Math.min(Math.abs(distance) * 0.1, 0.15); // Variable speed based on distance
                carObj.mesh.position.x += Math.sign(distance) * moveSpeed;
            } else {
                // Snap to exact position when very close
                carObj.mesh.position.x = targetSpot.position;
                targetSpot.isOccupied = true;
            }
        }
    });
}

function checkCollision(car1Position, car2Position) {
    const distance = car1Position.x - car2Position.x;
    return Math.abs(distance) < (CAR_LENGTH + MIN_CAR_SPACING);
}

export function spawnCar() {    
    try {
        const availableSpotIndex = findAvailableQueueSpot(queueSpots);
        if (availableSpotIndex === -1) {
            log('Queue is full, waiting...', 'info');
            return;
        }

        const spawnPosition = queueSpots[availableSpotIndex].position;
        const randomColor = carColors[Math.floor(Math.random() * carColors.length)];
        const car = createCar(randomColor);
        car.rotation.y = -Math.PI * 1;

        // Create label for car
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`#${nextCarId}`, 32, 16);

        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.SpriteMaterial({ map: texture });
        const label = new THREE.Sprite(labelMaterial);
        label.scale.set(1, 0.5, 1);
        label.position.set(0, 2, 0); // Position above car
        car.add(label); // Attach label to car

        scene.add(car);

        const carObj = {
            mesh: car,
            state: 'queue',
            timer: 0,
            currentStep: 0,
            visible: true,
            id: nextCarId // Store the ID
        };
        car.position.set(spawnPosition, 0, 0);
        cars.push(carObj);
        log(`Car #${nextCarId} spawned at position (${spawnPosition}, 0, 0)`);
        nextCarId++; // Increment ID counter
    } catch (error) {
        log(`Error spawning car: ${error.message}`, 'error');
    }
}

export function updateCarMovements(deltaTime, stepCubes, stepPositions) {
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
                // Check if this car is in spot 1 (front of queue)
                if (Math.abs(carObj.mesh.position.x - queueSpots[0].position) < 0.01 && !stepsOccupied[0]) {
                    carObj.state = 'moving';
                    carObj.timer = 0;
                    queueSpots[0].isOccupied = false;
                }
                break;

            case 'moving':
                handleMovingState(carObj, car, deltaTime, stepPositions, stepCubes);
                break;

            case 'step1':
            case 'step2':
            case 'step3':
                handleStepState(carObj, stepCubes);
                break;

            case 'moveToStep2':
            case 'moveToStep3':
                handleMoveToNextStep(carObj, car, deltaTime, stepPositions);
                break;

            case 'done':
                handleDoneState(carObj, car, deltaTime, stepPositions);
                break;
        }
    }
}

function handleMovingState(carObj, car, deltaTime, stepPositions, stepCubes) {
    if (!stepsOccupied[0]) {
        const targetX = stepPositions[0];
        let canMove = true;
        const nextPosition = { x: car.position.x + MOVE_SPEED * deltaTime };
        
        for (const otherCar of cars) {
            if (otherCar !== carObj && otherCar.visible) {
                if (checkCollision(nextPosition, otherCar.mesh.position)) {
                    canMove = false;
                    break;
                }
            }
        }

        if (canMove && car.position.x < targetX) {
            car.position.x += MOVE_SPEED * deltaTime;
        } else if (car.position.x >= targetX) {
            car.position.x = targetX;
            carObj.state = 'step1';
            carObj.timer = 0;
            carObj.currentStep = 0;
            stepsOccupied[0] = true;
            stepCubes[0].material.opacity = 0.6;
        }
    }
}

function handleStepState(carObj, stepCubes) {
    carObj.timer++;
    const stepIdx = parseInt(carObj.state.replace('step', '')) - 1;
    
    if (carObj.timer % 30 < 15) {
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
}

function handleMoveToNextStep(carObj, car, deltaTime, stepPositions) {
    const nextStep = parseInt(carObj.state.replace('moveToStep', '')) - 1;
    const targetX = stepPositions[nextStep];
    let canMove = true;
    const nextPosition = { x: car.position.x + MOVE_SPEED * deltaTime };
    
    for (const otherCar of cars) {
        if (otherCar !== carObj && otherCar.visible) {
            if (checkCollision(nextPosition, otherCar.mesh.position)) {
                canMove = false;
                break;
            }
        }
    }

    if (canMove && car.position.x < targetX) {
        car.position.x += MOVE_SPEED * deltaTime;
    } else if (car.position.x >= targetX) {
        car.position.x = targetX;
        carObj.state = 'step' + (nextStep + 1);
        stepsOccupied[nextStep] = true;
        carObj.timer = 0;
        carObj.currentStep = nextStep;
    }
}

function handleDoneState(carObj, car, deltaTime, stepPositions) {
    car.position.x += MOVE_SPEED * 1.5 * deltaTime;
    if (car.position.x > stepPositions[2] + 15) {
        car.visible = false;
        carObj.visible = false;
    }
}

export function updateSpawnTimer() {
    carSpawnTimer++;
    if (carSpawnTimer >= carSpawnInterval && cars.length < 10) {
        spawnCar();
        carSpawnTimer = 0;
    }
}
