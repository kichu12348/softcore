const audio = document.getElementById('audio');
const lyricsContainer = document.getElementById('lyricsContainer');

const lyricsData = [
    { time: 0.00, text: "I'm too consumed with my own life", duration: 4 },
    { time: 6.50, text: "Are we too young for this?", duration: 3 },
    { time: 11.07, text: "Feels like I can't move", duration: 3 },
    { time: 14.01, text: "Sharing my heart, it's tearing me apart", duration: 4 },
    { time: 17.84, text: "But I know I'd miss you, baby, if I left right now", duration: 5 },
    { time: 24.19, text: "Doing what I can, tryna be a man", duration: 3.5 },
    { time: 28.02, text: "And every time I kiss you, baby, I can hear the sound", duration: 4 },
    { time: 32.21, text: "Of breaking down", duration: 2.5 },
    { time: 45.95, text: "I've been confused as of late (yeah)", duration: 4 },
    { time: 51.08, text: "Watching my youth slip away (yeah)", duration: 4 },
    { time: 55.82, text: "You're like the sun, you wake me up", duration: 3.5 },
    { time: 58.53, text: "But you drain me out if I get too much", duration: 4 },
    { time: 61.31, text: "I might need room or I'll break", duration: 4 },
    { time: 67.72, text: "Are we too young for this?", duration: 3 }
];

let currentLine = 0;
let isPlaying = false;

lyricsData.forEach((lineObj, index) => {
    const lineEl = document.createElement('div');
    lineEl.className = 'line';
    lineEl.id = 'line-' + index;
    lineEl.textContent = lineObj.text;
    lyricsContainer.appendChild(lineEl);
});

let totalBars = 64;
const interlude = document.createElement('div');
interlude.className = 'visualizer';


function createBars(startIndex = 0, chunkSize = 10) {
    const endIndex = Math.min(startIndex + chunkSize, totalBars);
    
    for (let i = startIndex; i < endIndex; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        interlude.appendChild(bar);
    }
    
    if (endIndex < totalBars) {
        requestAnimationFrame(() => createBars(endIndex, chunkSize));
    } else {
        lyricsContainer.appendChild(interlude);
    }
}

createBars();

let audioContext;
let analyser;
let dataArray;

function initializeAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audio);
    
    // Increase frequency resolution
    analyser.fftSize = 64;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;
    
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    updateVisualizer();
}

function updateVisualizer() {
    if (!analyser) return;
    
    analyser.getByteFrequencyData(dataArray);
    const bars = document.querySelectorAll('.visualizer .bar');
    
    const time = Date.now() / 1000;
    const baseHeight = 60;
    
    bars.forEach((bar, index) => {
        const dataIndex = Math.floor(index * dataArray.length / bars.length);
        const frequency = dataArray[dataIndex];
        
        // Create dreamy wave pattern with multiple sine waves
        const wave1 = Math.sin(time * 1.5 + index * 0.15) * 0.5 + 0.5;
        const wave2 = Math.sin(time * 0.8 + index * 0.2) * 0.3 + 0.5;
        const waveHeight = baseHeight * (wave1 * 0.7 + wave2 * 0.3);
        
        const frequencyFactor = frequency / 255;
        const height = waveHeight + (frequencyFactor * 120);
        
        // Smooth height transition
        bar.style.height = `${height}px`;
        bar.style.transform = `scaleY(${1 + frequencyFactor * 0.3})`;
        
        // Dreamy color variation
        const hue = 240 + (frequencyFactor * 40);
        const saturation = 70 + (frequencyFactor * 30);
        const lightness = 40 + (frequencyFactor * 30);
        bar.style.backgroundColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.7 + frequencyFactor * 0.3})`;
    });
    
    requestAnimationFrame(updateVisualizer);
}

const handlePlayPause = () => {
    if (!audioContext) {
        initializeAudioContext();
    }
    
    if (!isPlaying) {
        audioContext.resume();
        audio.play();
        isPlaying = true;
        
        // Start visualizer animation
        updateVisualizer();
        
        // Reset volume if we're not at the fade out point
        if (audio.currentTime < 70) {
            audio.volume = 1;
        }
        // Enhanced fade in only if we're at the start
        if (audio.currentTime < 0.1) {
            fadeAudio('in', 1000);
        }
    } else {
        audio.pause();
        isPlaying = false;
    }
}

document.body.addEventListener('click', handlePlayPause);

// Update timeupdate event handler for smoother transitions
audio.addEventListener('timeupdate', () => {
    const currentTime = audio.currentTime;
    
    // Start fading out 2 seconds before the end
    if (currentTime >= 70) { // 1:10
        const remainingTime = 72 - currentTime; // 1:12 = 72 seconds
        audio.volume = Math.max(0, remainingTime / 2); // Smooth 2-second fade
    }

    if (currentLine < lyricsData.length) {
        const currentLyric = lyricsData[currentLine];

        // Remove the interlude-specific visualizer logic and just handle lyrics
        if (currentTime >= currentLyric.time) {
            document.querySelectorAll('.line').forEach((line, index) => {
                if (index < currentLine) {
                    line.classList.remove('active');
                    line.classList.add('fade-out');
                }
            });
            
            const currentLineEl = document.getElementById('line-' + currentLine);
            currentLineEl.classList.add('active');
            currentLineEl.classList.remove('fade-out');
            
            // Set up automatic fade out after duration
            setTimeout(() => {
                if (isPlaying) {
                    currentLineEl.classList.remove('active');
                    currentLineEl.classList.add('fade-out');
                }
            }, currentLyric.duration * 1000);
            
            currentLine++;
        }
    }
});

const handleTogle=(e)=>{
    e?.preventDefault();
    handlePlayPause();
}


window.addEventListener('keydown', (e) => {
    e.preventDefault();
    if (e.key === ' ') handleTogle(e);
});


// Update reset logic
audio.addEventListener('ended', () => {
    isPlaying = false;
    currentLine = 0;
    document.querySelectorAll('.line').forEach(line => {
        line.classList.remove('active', 'fade-out');
        // Reset any ongoing timeouts
        line.style.transition = '';
    });
    interlude.classList.remove('active');
});

// Enhanced fade in/out for smoother transitions
function fadeAudio(direction = 'in', duration = 1000) {
    const steps = 20;
    const stepTime = duration / steps;
    const stepAmount = direction === 'in' ? 1 / steps : -1 / steps;
    
    let current = direction === 'in' ? 0 : 1;
    
    const fade = setInterval(() => {
        current += stepAmount;
        audio.volume = Math.max(0, Math.min(1, current));
        
        if ((direction === 'in' && current >= 1) || 
            (direction === 'out' && current <= 0)) {
            clearInterval(fade);
        }
    }, stepTime);
}