document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('.scene'); // Listen on the scene for wider interaction area
    const carousel = document.querySelector('.carousel');
    // const cells = carousel.querySelectorAll('.carousel__cell'); // Not strictly needed for rotation logic
    const prevButton = document.querySelector('.previous-button');
    const nextButton = document.querySelector('.next-button');

    const cellCount = 3; // Fixed number of cells
    let selectedIndex = 0;
    const rotateFn = 'rotateY'; // Fixed to Y axis
    const theta = 360 / cellCount; // Angle between cells (120deg)
    
    // Use the radius defined in CSS for transform calculation consistency
    // We retrieve it from the computed style of the first cell's transform
    // This is a bit complex, alternative is to hardcode '280' if CSS is fixed
    let radius = 280; // Default/fallback, matching CSS
    const firstCell = carousel.querySelector('.carousel__cell');
    if (firstCell) {
        const transformStyle = window.getComputedStyle(firstCell).transform;
        // Attempt to parse translateZ from matrix3d or translateZ()
        const matrix = new DOMMatrixReadOnly(transformStyle);
        if (matrix.m34) { // Check if it's a 3D matrix
             // Formula for translateZ from matrix with perspective might be complex
             // console.log('Matrix:', matrix); 
             // For simple rotateY(A)translateZ(R), m33 is cos(A), m13 is sin(A), m43 is R? No, that's not quite right.
             // Let's stick to the hardcoded CSS value for simplicity unless dynamic calculation is essential.
             // console.log(`Using hardcoded radius: ${radius}px`);
        } else {
            // Fallback if matrix is not 3D or easier to parse translateZ directly
            const translateZMatch = transformStyle.match(/translateZ\((-?\d+(\.\d+)?)px\)/);
            if (translateZMatch && translateZMatch[1]) {
                radius = parseFloat(translateZMatch[1]);
                // console.log(`Parsed radius: ${radius}px`);
            }
        }
    }
    
    // Ensure the initial carousel transform also uses this radius
    carousel.style.transform = `translateZ(${-radius}px) ${rotateFn}(0deg)`;

    function rotateCarousel() {
        const angle = theta * selectedIndex * -1;
        // Rotate the entire carousel element
        carousel.style.transform = `translateZ(${-radius}px) ${rotateFn}(${angle}deg)`;
        console.log(`Rotating to index ${selectedIndex}, angle ${angle}deg`);
    }

    // --- Button Listeners ---
    prevButton.addEventListener('click', () => {
        selectedIndex--;
        rotateCarousel();
    });

    nextButton.addEventListener('click', () => {
        selectedIndex++;
        rotateCarousel();
    });

    // --- Mouse Wheel Listener ---
    let wheelTimeout;
    scene.addEventListener('wheel', (event) => {
        event.preventDefault(); // Prevent page scrolling

        // Basic throttling: only process wheel event every 100ms
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            const delta = Math.sign(event.deltaY); // Get scroll direction (+1 down, -1 up)
            if (delta > 0) {
                selectedIndex++;
            } else if (delta < 0) {
                selectedIndex--;
            }
            rotateCarousel();
        }, 50); // Adjust throttle time (ms) as needed
    }, { passive: false }); // Need passive: false to preventDefault

    // --- Touch Swipe Listeners ---
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50; // Minimum pixels to be considered a swipe

    scene.addEventListener('touchstart', (event) => {
        // Don't track multi-touch gestures
        if (event.touches.length === 1) {
            touchStartX = event.touches[0].clientX;
            touchEndX = touchStartX; // Initialize endX
        }
    }, { passive: true }); // Passive true for touchstart is generally okay

    scene.addEventListener('touchmove', (event) => {
        // Update touchEndX on move
        if (event.touches.length === 1) {
             // We could potentially prevent vertical scroll here if needed
             // event.preventDefault(); // Be cautious with this
            touchEndX = event.touches[0].clientX;
        }
    }, { passive: false }); // Use passive: false if you intend to preventDefault

    scene.addEventListener('touchend', (event) => {
        // Ensure it was a single touch end
        if (event.changedTouches.length === 1) { 
            const swipeDistance = touchEndX - touchStartX;

            if (Math.abs(swipeDistance) > swipeThreshold) { // It's a swipe
                if (swipeDistance < 0) { // Swiped left
                    selectedIndex++;
                } else { // Swiped right
                    selectedIndex--;
                }
                rotateCarousel();
            }
            // Reset values
            touchStartX = 0;
            touchEndX = 0;
        }
    });

    // Initial setup call (optional, CSS handles static position)
    // rotateCarousel(); 
}); 