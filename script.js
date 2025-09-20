// Get the HTML elements we need to work with
const changeVolumeBtn = document.getElementById('change-volume-btn');
const volumeLevelDisplay = document.getElementById('volume-level');
const mediaPlayer = document.getElementById('media-player');

// Add an event listener to the button. This function runs when the button is clicked.
changeVolumeBtn.addEventListener('click', () => {
    
    // 1. Generate a random number between 0 and 1 (e.g., 0.734)
    const randomVolume = Math.random();

    // 2. Set the video player's volume to this random number
    // The 'volume' property of a video/audio element is a value from 0.0 to 1.0
    mediaPlayer.volume = randomVolume;

    // 3. Display the new volume to the user
    // We multiply by 100 and round it to make it a nice percentage
    const volumeAsPercent = Math.round(randomVolume * 100);
    volumeLevelDisplay.textContent = volumeAsPercent;

    console.log(`Volume chaos! New volume set to: ${randomVolume}`);
});