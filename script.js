document.addEventListener('DOMContentLoaded', (event) => {
    const shirts = document.querySelectorAll('.shirt');
    const ratImage = document.getElementById('ratImage'); // Get the rat image element
    
    // --- Device Type Detection --- 
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
        // --- Mobile/Touch Interaction --- 
        console.log('Touch device detected. Setting up tap listeners.');
        shirts.forEach(shirt => {
            shirt.style.cursor = 'pointer'; // Change cursor to pointer for touch

            shirt.addEventListener('click', (e) => {
                const newRatSrc = shirt.getAttribute('data-rat-src');
                if (newRatSrc) {
                    ratImage.src = newRatSrc;
                    console.log(`Rat image changed to: ${newRatSrc}`);
                    // Optional: Add visual feedback on tap?
                    // shirt.style.transform = 'scale(0.95)';
                    // setTimeout(() => { shirt.style.transform = ''; }, 100);
                }
            });
        });

    } else {
        // --- Desktop Drag-and-Drop Interaction --- 
        console.log('Desktop device detected. Setting up drag listeners.');
        let activeShirt = null;
        let initialShirtPos = { left: '', top: '' }; // Store initial position
        let offsetX = 0;
        let offsetY = 0;

        shirts.forEach(shirt => {
            shirt.style.cursor = 'grab'; // Indicate draggable item

            shirt.addEventListener('mousedown', (e) => {
                // Prevent dragging background image if applicable
                e.preventDefault(); 
                
                activeShirt = shirt;
                
                // Store initial position using computed style for reliability
                const computedStyle = window.getComputedStyle(activeShirt);
                initialShirtPos.left = computedStyle.left;
                initialShirtPos.top = computedStyle.top;

                activeShirt.style.cursor = 'grabbing';
                activeShirt.style.zIndex = 1000;

                const rect = activeShirt.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });

        function onMouseMove(e) {
            if (!activeShirt) return;

            // Calculate new position based on mouse movement and initial offset
            // We need the container's position to calculate relative positioning
            const container = document.querySelector('.shirts-container'); // Assuming this is the positioning parent
            const containerRect = container.getBoundingClientRect();

            let newX = e.clientX - containerRect.left - offsetX;
            let newY = e.clientY - containerRect.top - offsetY;

            // Optional: Keep the shirt within the bounds of the container
            // newX = Math.max(0, Math.min(newX, containerRect.width - activeShirt.offsetWidth));
            // newY = Math.max(0, Math.min(newY, containerRect.height - activeShirt.offsetHeight));

            // Set the position using style.left and style.top (in pixels)
            activeShirt.style.left = `${newX}px`;
            activeShirt.style.top = `${newY}px`;
        }

        function onMouseUp() {
            if (activeShirt) {
                activeShirt.style.cursor = 'grab'; 
                activeShirt.style.zIndex = ''; 

                const shirtRect = activeShirt.getBoundingClientRect();
                const ratRect = ratImage.getBoundingClientRect();

                const collision = !(shirtRect.right < ratRect.left || 
                                    shirtRect.left > ratRect.right || 
                                    shirtRect.bottom < ratRect.top || 
                                    shirtRect.top > ratRect.bottom);

                if (collision) {
                    console.log('Collision detected!');
                    const newRatSrc = activeShirt.getAttribute('data-rat-src');
                    if (newRatSrc) {
                        ratImage.src = newRatSrc;
                        // Snap shirt back to original position after successful collision
                        activeShirt.style.left = initialShirtPos.left;
                        activeShirt.style.top = initialShirtPos.top;
                    }
                }

                activeShirt = null;
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }
}); 