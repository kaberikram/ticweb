document.addEventListener('DOMContentLoaded', () => {
    const shirts = document.querySelectorAll('.shirt');
    const ratImage = document.getElementById('ratImage');
    const shirtNameElement = document.getElementById('shirt-name');
    const getFreeButton = document.querySelector('.get-free-button');

    // Modal elements
    const modalOverlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('emailModal');
    const modalRatImage = document.getElementById('modalRatImage');
    const modalShirtName = document.getElementById('modalShirtName');
    const emailInput = document.getElementById('emailInput');
    const confirmButton = document.getElementById('confirmButton');
    const closeButton = document.getElementById('closeButton');
    const modalCloseX = document.getElementById('modalCloseX'); // Get the X button
    const initialState = modal.querySelector('.initial-state');
    const confirmedState = modal.querySelector('.confirmed-state');
    const modalConfirmShirtName = document.getElementById('modalConfirmShirtName');
    const instructionTooltip = document.getElementById('instruction-tooltip'); // Get tooltip

    let activeShirt = null;
    let initialShirtPos = { left: '', top: '' };
    let initialTouchPos = { x: 0, y: 0 };
    let currentPos = { x: 0, y: 0 };
    let lastX = 0;
    let lastY = 0;
    let isMoving = false;
    let moveTimeout;
    let tooltipTimeout; // Variable for the hide timer
    let tooltipVisible = false; // Track tooltip state

    // --- Tooltip Logic --- 
    function showTooltip() {
        if (instructionTooltip) {
             // Short delay before showing
            setTimeout(() => {
                instructionTooltip.classList.add('visible');
                tooltipVisible = true;
                 // Set timer to hide after a few seconds
                tooltipTimeout = setTimeout(hideTooltip, 5000); // Hide after 5 seconds 
            }, 500); // Show after 0.5 seconds
        }
    }

    function hideTooltip() {
        if (instructionTooltip && tooltipVisible) {
            clearTimeout(tooltipTimeout); // Clear the auto-hide timer
            instructionTooltip.classList.remove('visible');
            tooltipVisible = false;
        }
    }

    // Show tooltip initially
    showTooltip();

    // --- End Tooltip Logic --- 

    shirts.forEach(shirt => {
        shirt.style.cursor = 'grab';
        
        // Mobile touch events
        shirt.addEventListener('touchstart', (e) => {
            hideTooltip(); // Hide tooltip on interaction start
            handleStart(e); 
        }, { passive: false });
        // Desktop mouse events
        shirt.addEventListener('mousedown', (e) => {
            hideTooltip(); // Hide tooltip on interaction start
            handleStart(e);
        });
    });

    function handleStart(e) {
        e.preventDefault();
        activeShirt = e.target;

        // Store initial position
        const computedStyle = window.getComputedStyle(activeShirt);
        initialShirtPos.left = computedStyle.left || '0px';
        initialShirtPos.top = computedStyle.top || '0px';

        // Convert initial position from px to number
        currentPos.x = parseInt(initialShirtPos.left) || 0;
        currentPos.y = parseInt(initialShirtPos.top) || 0;

        if (e.type === 'mousedown') {
            lastX = e.clientX;
            lastY = e.clientY;
            initialTouchPos.x = e.clientX;
            initialTouchPos.y = e.clientY;
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleEnd);
        } else if (e.type === 'touchstart') {
            const touch = e.touches[0];
            lastX = touch.clientX;
            lastY = touch.clientY;
            initialTouchPos.x = touch.clientX;
            initialTouchPos.y = touch.clientY;
            document.addEventListener('touchmove', handleMove, { passive: false });
            document.addEventListener('touchend', handleEnd);
            document.addEventListener('touchcancel', handleEnd);
        }

        activeShirt.style.cursor = 'grabbing';
        activeShirt.style.zIndex = '1000';
        activeShirt.classList.add('grabbed');
    }

    function handleMove(e) {
        if (!activeShirt) return;
        e.preventDefault();

        let clientX, clientY;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            const touch = e.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        }

        // Calculate the distance moved
        const deltaX = clientX - lastX;
        const deltaY = clientY - lastY;

        // Update current position
        currentPos.x += deltaX;
        currentPos.y += deltaY;

        // Apply the new position
        activeShirt.style.left = `${currentPos.x}px`;
        activeShirt.style.top = `${currentPos.y}px`;

        // Handle distortion effect
        const isMovingNow = Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2;
        if (isMovingNow && !isMoving) {
            activeShirt.classList.remove('grabbed');
            activeShirt.classList.add(deltaX > 0 ? 'dragging-right' : 'dragging-left');
            isMoving = true;
        } else if (isMoving && deltaX !== 0) {
            activeShirt.classList.remove('dragging-right', 'dragging-left');
            activeShirt.classList.add(deltaX > 0 ? 'dragging-right' : 'dragging-left');
        }

        // Update last position
        lastX = clientX;
        lastY = clientY;

        // Handle movement pause
        if (moveTimeout) clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
            if (isMoving) {
                activeShirt.classList.remove('dragging-right', 'dragging-left');
                activeShirt.classList.add('grabbed');
                isMoving = false;
            }
        }, 50);
    }

    function handleEnd(e) {
        if (!activeShirt) return;

        // Check for collision with rat
        const shirtRect = activeShirt.getBoundingClientRect();
        const ratRect = ratImage.getBoundingClientRect();
        const collision = !(shirtRect.right < ratRect.left || 
                          shirtRect.left > ratRect.right || 
                          shirtRect.bottom < ratRect.top || 
                          shirtRect.top > ratRect.bottom);

        if (collision) {
            const newRatSrc = activeShirt.getAttribute('data-rat-src');
            if (newRatSrc) {
                ratImage.src = newRatSrc;

                // Update the shirt name text using the data attribute
                const shirtName = activeShirt.getAttribute('data-shirt-name');
                if (shirtName) {
                    shirtNameElement.textContent = shirtName;
                } else {
                    // Fallback if data attribute is missing
                    shirtNameElement.textContent = 'Unknown Shirt'; 
                }

                // Reset position
                activeShirt.style.left = initialShirtPos.left;
                activeShirt.style.top = initialShirtPos.top;
                currentPos.x = parseInt(initialShirtPos.left) || 0;
                currentPos.y = parseInt(initialShirtPos.top) || 0;
            }
        }

        // Reset styles
        activeShirt.style.cursor = 'grab';
        activeShirt.style.zIndex = '';
        activeShirt.classList.remove('dragging-right', 'dragging-left', 'grabbed');

        // Clean up
        if (moveTimeout) clearTimeout(moveTimeout);

        // Remove all event listeners
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('touchcancel', handleEnd);

        activeShirt = null;
        isMoving = false;
    }

    // --- Modal Logic --- 

    // Function to close the modal
    function closeModal() {
        modalOverlay.style.display = 'none';
    }

    // Show modal when 'Get for free' is clicked
    getFreeButton.addEventListener('click', () => {
        // Set the image in the modal to the currently displayed rat image
        modalRatImage.src = ratImage.src;
        // Set the T-shirt name in the modal instruction
        modalShirtName.textContent = shirtNameElement.textContent;
        
        // Ensure the initial state is visible and confirmed state is hidden
        initialState.style.display = 'flex'; // Use flex as defined in CSS
        confirmedState.style.display = 'none';
        emailInput.value = ''; // Clear previous email input

        // Show the modal overlay
        modalOverlay.style.display = 'flex'; // Use flex to trigger centering styles
    });

    // Handle confirm button click
    confirmButton.addEventListener('click', () => {
        const email = emailInput.value;
        const chosenShirt = shirtNameElement.textContent;

        // Basic validation (optional, can be enhanced)
        if (!email || !email.includes('@')) { 
            alert('Please enter a valid email address.');
            return; 
        }

        console.log(`Email: ${email}, Chosen Shirt: ${chosenShirt}`); // Log for now
        // TODO: Implement actual submission logic here (e.g., send to server)

        // Update the shirt name in the confirmation message
        modalConfirmShirtName.textContent = chosenShirt;

        // Switch to confirmed state
        initialState.style.display = 'none';
        confirmedState.style.display = 'flex'; // Use flex as defined in CSS
    });

    // Handle close button click (from confirmed state)
    closeButton.addEventListener('click', closeModal);

    // Handle X button click (from initial state)
    modalCloseX.addEventListener('click', closeModal);

    // Optional: Close modal if clicking outside the modal content
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });
}); 