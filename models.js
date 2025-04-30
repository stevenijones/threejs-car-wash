import * as THREE from 'three';

export function createCar(color) {
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

    // Wheels
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
    ];
    
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(pos.x, 0.22, pos.z);
        wheel.castShadow = true;
        car.add(wheel);
    });

    return car;
}

// Car colors palette
export const carColors = [
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
