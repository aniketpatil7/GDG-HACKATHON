document.addEventListener('DOMContentLoaded', () => {
    // --- GENERAL ELEMENTS ---
    const mediaPlayer = document.getElementById('media-player');
    const volumeLevelDisplay = document.getElementById('volume-level');
    const modeTitle = document.getElementById('mode-title');
    const modeDescription = document.getElementById('mode-description');
    
    // --- MODE BUTTONS & PANELS ---
    const modeButtons = document.querySelectorAll('.mode-btn');
    const controlPanels = document.querySelectorAll('.control-panel');

    // --- MODE-SPECIFIC ELEMENTS ---
    const changeVolumeBtn = document.getElementById('change-volume-btn');
    const snailSlider = document.getElementById('snail-slider');
    const typewriterInput = document.getElementById('typewriter-input');
    const sentenceToType = document.getElementById('sentence-to-type').innerText;
    const permissionBtn = document.getElementById('permission-btn');
    const mathProblemEl = document.getElementById('math-problem');
    const mathAnswerEl = document.getElementById('math-answer');
    const mathSubmitBtn = document.getElementById('math-submit');
    const weatherBtn = document.getElementById('weather-btn');
    const weatherInfoEl = document.getElementById('weather-info');
    const modelStatusEl = document.getElementById('model-status');
    const canvas = document.getElementById('digit-canvas');
    const ctx = canvas.getContext('2d');
    const detectBtn = document.getElementById('detect-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    // --- STATE VARIABLES ---
    let snailInterval = null;
    let correctAnswer = 0;
    let model;
    let isDrawing = false;

    // --- UNIVERSAL & HELPER FUNCTIONS ---
    function setVolume(volumeValue) {
        const clampedVolume = Math.max(0, Math.min(1, volumeValue));
        mediaPlayer.volume = clampedVolume;
        volumeLevelDisplay.textContent = Math.round(clampedVolume * 100);
    }
    const scaleValue = (value, from, to) => {
        const scale = (to[1] - to[0]) / (from[1] - from[0]);
        const capped = Math.max(from[0], Math.min(from[1], value));
        return (capped - from[0]) * scale + to[0];
    };

    // --- ALL MODE LOGIC FUNCTIONS ---
    const handleRngClick = () => setVolume(Math.random());

    function handleSnailSlide() {
        clearInterval(snailInterval);
        const targetVolume = snailSlider.value / 100;
        let currentVolume = mediaPlayer.volume;
        snailInterval = setInterval(() => {
            if (Math.abs(targetVolume - currentVolume) < 0.01) clearInterval(snailInterval);
            else { currentVolume += (targetVolume - currentVolume) * 0.1; setVolume(currentVolume); }
        }, 50);
    }
    
    function handleTypewriterInput() {
        const typedText = typewriterInput.value; let correctChars = 0;
        for(let i = 0; i < sentenceToType.length; i++) {
            if (i < typedText.length && typedText[i] === sentenceToType[i]) correctChars++; else break;
        }
        setVolume(correctChars / sentenceToType.length);
    }

    function handleShake(event) {
        const { x, y, z } = event.accelerationIncludingGravity;
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const volume = scaleValue(magnitude, [9.8, 30], [0, 1]);
        setVolume(volume);
    }

    function generateMathProblem() {
        const num1 = Math.ceil(Math.random() * 10); const num2 = Math.ceil(Math.random() * 10);
        correctAnswer = num1 * num2;
        mathProblemEl.innerText = `${num1} × ${num2} = ?`;
        mathAnswerEl.value = '';
    }

    function handleSubmitMath() {
        setVolume(parseInt(mathAnswerEl.value, 10) === correctAnswer ? 0.3 : 1.0);
        generateMathProblem();
    }

    async function fetchWeatherAndSetVolume() {
        const cities = [
            { name: 'Reykjavik', lat: 64.15, lon: -21.94 }, { name: 'Dubai', lat: 25.20, lon: 55.27 },
            { name: 'Tokyo', lat: 35.68, lon: 139.69 }, { name: 'Sydney', lat: -33.87, lon: 151.21 }
        ];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        weatherInfoEl.innerText = `Fetching weather for ${randomCity.name}...`;
        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${randomCity.lat}&longitude=${randomCity.lon}&current_weather=true`);
            const data = await response.json();
            const temp = data.current_weather.temperature;
            const volume = scaleValue(temp, [-10, 40], [0, 1]);
            setVolume(volume);
            weatherInfoEl.innerText = `The volume is set by the temperature in ${randomCity.name}: ${temp}°C`;
        } catch (error) { weatherInfoEl.innerText = 'Could not fetch weather.'; }
    }

    async function loadModel() {
        try {
            model = await tf.loadLayersModel('https://raw.githubusercontent.com/araltasher/ml-models-for-public/main/mnist-tfjs/model.json');
            modelStatusEl.innerText = 'Draw a digit (0-9) and click Detect.';
            detectBtn.disabled = false;
        } catch (error) { modelStatusEl.innerText = 'Error loading ML model.'; console.error(error); }
    }

    function preprocessCanvas() {
        return tf.tidy(() => tf.browser.fromPixels(canvas, 1).resizeNearestNeighbor([28, 28]).toFloat().div(tf.scalar(255.0)).expandDims(0));
    }

    async function predictDigit() {
        if (!model) return; modelStatusEl.innerText = 'Analyzing...';
        const tensor = preprocessCanvas();
        const predictions = await model.predict(tensor).data();
        const highestProbIndex = predictions.indexOf(Math.max(...predictions));
        const volume = (highestProbIndex === 0) ? 1.0 : highestProbIndex / 10;
        setVolume(volume);
        modelStatusEl.innerText = `Detected: ${highestProbIndex}. Volume set to ${Math.round(volume * 100)}%.`;
    }

    function startDrawing(e) { isDrawing = true; draw(e); }
    function stopDrawing() { isDrawing = false; ctx.beginPath(); }
    function draw(e) {
        if (!isDrawing) return; e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.strokeStyle = '#000000';
        ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
    }
    const clearCanvas = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); modelStatusEl.innerText = 'Draw a digit (0-9) and click Detect.'; };

    // --- MODE SWITCHING ---
    function switchMode(mode) {
        modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
        controlPanels.forEach(panel => panel.classList.toggle('hidden', panel.id !== `${mode}-controls`));

        window.removeEventListener('devicemotion', handleShake);
        if (mode === 'math') generateMathProblem();
        
        const titles = { rng: 'The RNG Special', snail: 'The Snail Slider', typewriter: 'The Typewriter', shaker: 'The Shaker', math: 'The Math Problem', weather: 'The Weather Channel', handwriting: 'The Handwriting Test' };
        const descriptions = { rng: 'You don\'t choose the volume...', snail: 'Patience is a virtue...', typewriter: 'Your typing accuracy is key.', shaker: 'Get physical. Shake your phone.', math: 'A simple question with high stakes.', weather: 'The forecast is loud...', handwriting: 'Your penmanship sets the volume.' };
        modeTitle.innerText = titles[mode];
        modeDescription.innerText = descriptions[mode];
    }

    // --- EVENT LISTENERS ---
    modeButtons.forEach(button => button.addEventListener('click', () => switchMode(button.dataset.mode)));
    changeVolumeBtn.addEventListener('click', handleRngClick);
    snailSlider.addEventListener('input', handleSnailSlide);
    typewriterInput.addEventListener('input', handleTypewriterInput);
    mathSubmitBtn.addEventListener('click', handleSubmitMath);
    weatherBtn.addEventListener('click', fetchWeatherAndSetVolume);
    permissionBtn.addEventListener('click', () => {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(state => {
                if (state === 'granted') { window.addEventListener('devicemotion', handleShake); permissionBtn.innerText = 'Shaker Enabled!'; }
            });
        } else { window.addEventListener('devicemotion', handleShake); permissionBtn.innerText = 'Shaker Enabled!'; }
    });
    canvas.addEventListener('mousedown', startDrawing); canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing); canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchstart', startDrawing); canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchmove', draw);
    detectBtn.addEventListener('click', predictDigit);
    clearBtn.addEventListener('click', clearCanvas);

    // --- INITIALIZE ---
    switchMode('rng');
    detectBtn.disabled = true;
    loadModel();
});
