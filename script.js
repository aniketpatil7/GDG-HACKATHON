document.addEventListener('DOMContentLoaded', () => {
    // --- GENERAL ELEMENTS ---
    const mediaPlayer = document.getElementById('media-player');
    const volumeLevelDisplay = document.getElementById('volume-level');
    const modeTitle = document.getElementById('mode-title');
    const modeDescription = document.getElementById('mode-description');
    
    // --- MODE BUTTONS & PANELS ---
    const modeButtons = document.querySelectorAll('.mode-btn');
    const controlPanels = document.querySelectorAll('.control-panel');

    // --- RNG ELEMENTS ---
    const changeVolumeBtn = document.getElementById('change-volume-btn');

    // --- SNAIL SLIDER ELEMENTS ---
    const snailSlider = document.getElementById('snail-slider');
    let snailInterval = null;

    // --- TYPEWRITER ELEMENTS ---
    const typewriterInput = document.getElementById('typewriter-input');
    const sentenceToType = document.getElementById('sentence-to-type').innerText;

    // --- SHAKER ELEMENTS ---
    const permissionBtn = document.getElementById('permission-btn');

    // --- MATH ELEMENTS ---
    const mathProblemEl = document.getElementById('math-problem');
    const mathAnswerEl = document.getElementById('math-answer');
    const mathSubmitBtn = document.getElementById('math-submit');
    let correctAnswer = 0;

    // --- WEATHER ELEMENTS ---
    const weatherBtn = document.getElementById('weather-btn');
    const weatherInfoEl = document.getElementById('weather-info');

    // --- UNIVERSAL FUNCTION TO UPDATE VOLUME ---
    function setVolume(volumeValue) {
        const clampedVolume = Math.max(0, Math.min(1, volumeValue));
        mediaPlayer.volume = clampedVolume;
        volumeLevelDisplay.textContent = Math.round(clampedVolume * 100);
    }
    
    // --- HELPER FUNCTION to scale a number from one range to another ---
    const scaleValue = (value, from, to) => {
        const scale = (to[1] - to[0]) / (from[1] - from[0]);
        const capped = Math.max(from[0], Math.min(from[1], value));
        return (capped - from[0]) * scale + to[0];
    };

    // --- MODE LOGIC ---

    const handleRngClick = () => setVolume(Math.random());

    function handleSnailSlide() {
        clearInterval(snailInterval);
        const targetVolume = snailSlider.value / 100;
        let currentVolume = mediaPlayer.volume;
        snailInterval = setInterval(() => {
            if (Math.abs(targetVolume - currentVolume) < 0.01) {
                clearInterval(snailInterval);
            } else {
                currentVolume += (targetVolume - currentVolume) * 0.1;
                setVolume(currentVolume);
            }
        }, 50);
    }
    
    function handleTypewriterInput() {
        const typedText = typewriterInput.value;
        let correctChars = 0;
        for(let i = 0; i < sentenceToType.length; i++) {
            if (i < typedText.length && typedText[i] === sentenceToType[i]) correctChars++;
            else break;
        }
        setVolume(correctChars / sentenceToType.length);
    }

    function handleShake(event) {
        const { x, y, z } = event.accelerationIncludingGravity;
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        // Scale magnitude (approx 9.8 at rest to ~30 when shaking) to volume 0-1
        const volume = scaleValue(magnitude, [9.8, 30], [0, 1]);
        setVolume(volume);
    }

    function generateMathProblem() {
        const num1 = Math.ceil(Math.random() * 10);
        const num2 = Math.ceil(Math.random() * 10);
        correctAnswer = num1 * num2;
        mathProblemEl.innerText = `${num1} × ${num2} = ?`;
        mathAnswerEl.value = '';
    }

    function handleSubmitMath() {
        const userAnswer = parseInt(mathAnswerEl.value, 10);
        if (userAnswer === correctAnswer) {
            setVolume(0.3); // Reward with 30% volume
        } else {
            setVolume(1.0); // Punish with 100% volume
        }
        generateMathProblem();
    }

    async function fetchWeatherAndSetVolume() {
        const cities = [
            { name: 'Reykjavik', lat: 64.15, lon: -21.94 }, { name: 'Dubai', lat: 25.20, lon: 55.27 },
            { name: 'Singapore', lat: 1.35, lon: 103.82 }, { name: 'Cairo', lat: 30.04, lon: 31.24 },
            { name: 'Tokyo', lat: 35.68, lon: 139.69 }, { name: 'Sydney', lat: -33.87, lon: 151.21 }
        ];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        weatherInfoEl.innerText = `Fetching weather for ${randomCity.name}...`;

        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${randomCity.lat}&longitude=${randomCity.lon}&current_weather=true`);
            const data = await response.json();
            const temp = data.current_weather.temperature;
            // Scale temperature from a range of -10°C to 40°C to a volume from 0 to 1
            const volume = scaleValue(temp, [-10, 40], [0, 1]);
            setVolume(volume);
            weatherInfoEl.innerText = `The volume is set by the temperature in ${randomCity.name}: ${temp}°C`;
        } catch (error) {
            weatherInfoEl.innerText = 'Could not fetch weather. API might be down.';
        }
    }

    // --- MODE SWITCHING ---
    function switchMode(mode) {
        modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
        controlPanels.forEach(panel => panel.classList.toggle('hidden', panel.id !== `${mode}-controls`));

        // Special handling for shaker mode to add/remove the event listener
        window.removeEventListener('devicemotion', handleShake);
        if (mode === 'shaker') {
            // The shaker needs permission, which we handle with the button
        } else if (mode === 'math') {
            generateMathProblem(); // Generate a problem when switching to math mode
        } else if (mode === 'weather') {
            weatherInfoEl.innerText = 'Volume is based on the temperature somewhere in the world.';
        }

        const titles = {
            rng: 'The RNG Volume Special', snail: 'The Snail Slider', typewriter: 'The Typewriter',
            shaker: 'The Shaker', math: 'The Math Problem', weather: 'The Weather Channel'
        };
        const descriptions = {
            rng: 'You don\'t choose the volume. The volume chooses you.', snail: 'Patience is a virtue. Or so they say.',
            typewriter: 'Your typing accuracy determines the volume.', shaker: 'Get physical. Shake your phone to set the volume.',
            math: 'A simple question with high stakes.', weather: 'The forecast is loud with a chance of quiet.'
        };
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

    // Special permission handling for shaker mode (required by modern browsers)
    permissionBtn.addEventListener('click', () => {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('devicemotion', handleShake);
                    permissionBtn.innerText = 'Shaker Enabled!';
                }
            }).catch(console.error);
        } else {
            // Handle non-iOS 13+ devices
            window.addEventListener('devicemotion', handleShake);
            permissionBtn.innerText = 'Shaker Enabled!';
        }
    });

    // --- INITIALIZE ---
    switchMode('rng'); // Start in RNG mode
});
