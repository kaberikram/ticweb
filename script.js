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
    const preDeadlineMessage = document.getElementById('preDeadlineMessage'); // Get pre-deadline msg p
    const postDeadlineMessage = document.getElementById('postDeadlineMessage'); // Get post-deadline msg p

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

    // --- Deadline --- 
    const deadline = new Date('2025-04-20T00:00:00+08:00'); // April 20, 2025, 00:00 Malaysia Time (UTC+8)
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyDFAibnf40orYPTjlAf63YQj-IbwfROw-gYXBhoV0XwMPGgAf6ObZf7XJN0em_I3Byew/exec';

    // Handle confirm button click
    confirmButton.addEventListener('click', () => {
        const email = emailInput.value;
        const chosenShirt = shirtNameElement.textContent;
        const currentTime = new Date();

        // Basic validation
        if (!email || !email.includes('@')) { 
            alert('Please enter a valid email address.');
            return; 
        }

        // --- Send data to Google Sheet --- 
        confirmButton.disabled = true;
        confirmButton.textContent = 'Submitting...';

        const formData = { email: email, shirtName: chosenShirt };

        fetch(scriptURL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow',
            body: JSON.stringify(formData)
        })
        .then(response => response.json()) // Parse the JSON response from Apps Script
        .then(data => {
            console.log('Google Sheet Response:', data);
            if (data.result === "success") {
                // --- Submission Successful --- 
                // Check deadline and set appropriate message visibility
                if (currentTime < deadline) {
                    preDeadlineMessage.style.display = 'block';
                    postDeadlineMessage.style.display = 'none';
                    modalConfirmShirtName.textContent = chosenShirt;
                } else {
                    preDeadlineMessage.style.display = 'none';
                    postDeadlineMessage.style.display = 'block';
                }
                // Switch to confirmed state view
                initialState.style.display = 'none';
                confirmedState.style.display = 'flex';
            } else {
                // --- Submission Failed (Error from Apps Script) --- 
                console.error('Error reported by Apps Script:', data.message);
                alert('Sorry, there was an error submitting your entry. Please try again. \nError: ' + data.message);
            }
        })
        .catch((error) => {
            // --- Network or other fetch error --- 
            console.error('Fetch Error:', error);
            alert('Sorry, a network error occurred. Please check your connection and try again.');
        })
        .finally(() => {
            // --- Always re-enable button --- 
            confirmButton.disabled = false;
            confirmButton.textContent = 'Confirm';
        });

        // NOTE: The original logic to switch views is now inside the fetch().then() block
        // to ensure it only happens after successful submission.
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