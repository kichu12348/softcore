const audio = document.getElementById('audio');
const playButton = document.getElementById('playButton');
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

// Replace interlude element with visualizer
const interlude = document.createElement('div');
interlude.className = 'visualizer';
interlude.innerHTML = `
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
`;
lyricsContainer.appendChild(interlude);

playButton.addEventListener('click', () => {
    if (!isPlaying) {
        audio.play();
        playButton.textContent = 'Pause';
        isPlaying = true;
        
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
        playButton.textContent = 'Play';
        isPlaying = false;
    }
});

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

        // Handle interlude gap with cassette animation
        if (currentTime > 32.21 && currentTime < 45.95) {
            document.querySelectorAll('.line').forEach(line => {
                line.classList.remove('active');
                line.classList.add('fade-out');
            });
            interlude.classList.add('active');
        } else {
            interlude.classList.remove('active');
        }

        // Show new line when it's time
        if (currentTime >= currentLyric.time) {
            // Fade out all previous lines immediately
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

// Update reset logic
audio.addEventListener('ended', () => {
    playButton.textContent = 'Play';
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