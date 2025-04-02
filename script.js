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
                    // Quick grab effect
                    shirt.classList.add('grabbed');
                    setTimeout(() => {
                        shirt.classList.remove('grabbed');
                    }, 200);
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
        let lastMouseX = 0;
        let lastMouseY = 0;
        let isMoving = false;
        let moveTimeout;
        let currentDirection = null;

        shirts.forEach(shirt => {
            shirt.style.cursor = 'grab'; // Indicate draggable item

            shirt.addEventListener('mousedown', (e) => {
                // Prevent dragging background image if applicable
                e.preventDefault(); 
                
                activeShirt = shirt;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                
                // Store initial position using computed style for reliability
                const computedStyle = window.getComputedStyle(activeShirt);
                initialShirtPos.left = computedStyle.left;
                initialShirtPos.top = computedStyle.top;

                activeShirt.style.cursor = 'grabbing';
                activeShirt.style.zIndex = 1000;
                
                // Initial grab state
                activeShirt.classList.add('grabbed');

                const rect = activeShirt.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });

        function onMouseMove(e) {
            if (!activeShirt) return;

            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            const isMovingNow = Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2;

            if (isMovingNow) {
                // Determine direction based on deltaX
                const newDirection = deltaX > 0 ? 'right' : 'left';
                
                if (currentDirection !== newDirection) {
                    // Remove previous direction class if it exists
                    if (currentDirection) {
                        activeShirt.classList.remove(`dragging-${currentDirection}`);
                    }
                    // Add new direction class
                    activeShirt.classList.remove('grabbed');
                    activeShirt.classList.add(`dragging-${newDirection}`);
                    currentDirection = newDirection;
                }
                
                isMoving = true;
            }

            // Update last position
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;

            // Clear existing timeout
            if (moveTimeout) {
                clearTimeout(moveTimeout);
            }

            // Set new timeout
            moveTimeout = setTimeout(() => {
                if (isMoving) {
                    // Stopped moving
                    if (currentDirection) {
                        activeShirt.classList.remove(`dragging-${currentDirection}`);
                        currentDirection = null;
                    }
                    activeShirt.classList.add('grabbed');
                    isMoving = false;
                }
            }, 50);

            const container = document.querySelector('.shirts-container');
            const containerRect = container.getBoundingClientRect();

            let newX = e.clientX - containerRect.left - offsetX;
            let newY = e.clientY - containerRect.top - offsetY;

            activeShirt.style.left = `${newX}px`;
            activeShirt.style.top = `${newY}px`;
        }

        function onMouseUp() {
            if (activeShirt) {
                activeShirt.style.cursor = 'grab'; 
                activeShirt.style.zIndex = ''; 
                
                // Remove all effect classes
                activeShirt.classList.remove('grabbed');
                if (currentDirection) {
                    activeShirt.classList.remove(`dragging-${currentDirection}`);
                    currentDirection = null;
                }

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

                if (moveTimeout) {
                    clearTimeout(moveTimeout);
                }
                
                activeShirt = null;
                isMoving = false;
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }
}); 