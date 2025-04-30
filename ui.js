// Debug utilities
const debugPanel = document.getElementById('debug-panel');
const maxLogs = 20;
let logs = [];

export function log(message, type = 'info') {
    console.log(message);
    logs.unshift({ message, type });
    if (logs.length > maxLogs) logs.pop();
    
    debugPanel.innerHTML = logs
        .map(log => `<p class="${log.type}">${log.type.toUpperCase()}: ${log.message}</p>`)
        .join('');
}

// Animation state
export let isAnimating = true;
let simulationStartTime = performance.now();
let totalSimulationTime = 0;

// Format time as MM:SS
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update simulation time display
export function updateSimulationTime(currentTime) {
    if (isAnimating) {
        totalSimulationTime = currentTime - simulationStartTime;
    }
    const timeDisplay = document.getElementById('simulation-time');
    timeDisplay.textContent = `Simulation time: ${formatTime(totalSimulationTime)}`;
}

// Get control buttons
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');

// Button event listeners
playButton.addEventListener('click', () => {
    isAnimating = true;
    playButton.disabled = true;
    pauseButton.disabled = false;
    log('Animation resumed', 'info');
    const currentTime = performance.now();
    simulationStartTime = currentTime - totalSimulationTime;
});

pauseButton.addEventListener('click', () => {
    isAnimating = false;
    playButton.disabled = false;
    pauseButton.disabled = true;
    log('Animation paused', 'info');
});

// Initial button states
playButton.disabled = true;
pauseButton.disabled = false;

// Error handling
window.addEventListener('error', function(e) {
    log(e.error.message || 'Unknown error', 'error');
    console.error('Global error:', e.error);
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    log(`Promise error: ${e.reason}`, 'error');
});
