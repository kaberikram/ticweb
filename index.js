document.addEventListener('DOMContentLoaded', () => {
    const tvFrameImage = document.querySelector('.tv-frame-image');
    const videoOverlay = document.getElementById('videoOverlay');
    const closeVideoOverlayButton = document.getElementById('closeVideoOverlay');
    const youtubeIframe = document.getElementById('youtubeVideo');

    const youtubeVideoSrc = 'https://www.youtube.com/embed/HMwTl6wHFsQ?si=rdN_Etzk-pp510JT&controls=0&autoplay=1'; // Updated link with autoplay and controls

    if (tvFrameImage && videoOverlay && closeVideoOverlayButton && youtubeIframe) {
        // Function to open the overlay
        const openOverlay = () => {
            youtubeIframe.src = youtubeVideoSrc; // Set src only when opening
            videoOverlay.style.display = 'flex';
        };

        // Function to close the overlay
        const closeOverlay = () => {
            videoOverlay.style.display = 'none';
            youtubeIframe.src = ''; // Stop video by clearing src
        };

        // Event listener for TV frame image click
        tvFrameImage.addEventListener('click', openOverlay);

        // Event listener for close button click
        closeVideoOverlayButton.addEventListener('click', closeOverlay);

        // Optional: Event listener to close when clicking the overlay background
        videoOverlay.addEventListener('click', (event) => {
            // Close only if the click is directly on the overlay background
            if (event.target === videoOverlay) {
                closeOverlay();
            }
        });
    }
}); 