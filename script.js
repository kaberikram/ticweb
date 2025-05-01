import { inject } from "@vercel/analytics";

inject();

// --- LocalStorage Helper Functions ---
const STORAGE_KEY = 'submittedTicEmails';

function getSubmittedEmails() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        try {
            const emails = JSON.parse(storedData);
            // Ensure it's an array
            return Array.isArray(emails) ? emails : [];
        } catch (e) {
            console.error("Error parsing submitted emails from localStorage:", e);
            return []; // Return empty array on error
        }
    } 
    return []; // Return empty array if nothing stored
}

function hasEmailBeenSubmitted(email) {
    if (!email) return false;
    const submittedEmails = getSubmittedEmails();
    return submittedEmails.includes(email.toLowerCase());
}

function addSubmittedEmail(email) {
    if (!email) return;
    const submittedEmails = getSubmittedEmails();
    const lowerCaseEmail = email.toLowerCase();
    if (!submittedEmails.includes(lowerCaseEmail)) {
        submittedEmails.push(lowerCaseEmail);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(submittedEmails));
    }
}
// --- End LocalStorage Helpers ---

// --- Onboarding Logic ---
const ONBOARDING_STORAGE_KEY = 'hasVisitedTicWeb';

function runOnboardingAnimation() {
    const handElement = document.getElementById('onboarding-hand');
    const instructionElement = document.getElementById('onboarding-instruction');
    const firstShirt = document.querySelector('.shirt.bottom-left'); // Changed target to bottom-left shirt (3Shirt)
    const ratElement = document.getElementById('ratImage');

    if (!handElement || !instructionElement || !firstShirt || !ratElement) {
        console.warn("Onboarding elements not found, skipping animation.");
        return;
    }

    // Calculate positions
    const firstShirtRect = firstShirt.getBoundingClientRect();
    const ratRect = ratElement.getBoundingClientRect();
    const containerRect = document.querySelector('.container').getBoundingClientRect();

    // Adjust positions relative to the container/viewport
    const startX = firstShirtRect.left + firstShirtRect.width * 0.5 - containerRect.left;
    const startY = firstShirtRect.top + firstShirtRect.height * 0.5 - containerRect.top;
    
    // Target center of the rat
    const endX = ratRect.left + ratRect.width * 0.5 - containerRect.left;
    const endY = ratRect.top + ratRect.height * 0.5 - containerRect.top;
    
    // Calculate movement delta for animation
    const moveX = endX - startX;
    const moveY = endY - startY;

    // Set initial position of hand and instruction
    handElement.style.left = `${startX}px`;
    handElement.style.top = `${startY}px`;
    instructionElement.style.left = `${startX + 30}px`; // Offset instruction
    instructionElement.style.top = `${startY - 40}px`; // Offset instruction

    // Update animation keyframes dynamically
    const styleSheet = document.styleSheets[0]; // Assuming style.css is the first stylesheet
    let ruleIndex = -1;
    try {
        for (let i = 0; i < styleSheet.cssRules.length; i++) {
            if (styleSheet.cssRules[i].name === 'hand-guidance') {
                ruleIndex = i;
                break;
            }
        }

        if (ruleIndex !== -1) {
            const keyframesRule = styleSheet.cssRules[ruleIndex];
            // Find the 75% and 90/100% keyframes to update transform
             // Update 75% keyframe
            const keyframe75 = keyframesRule.findRule('75%');
            if (keyframe75) {
                keyframe75.style.transform = `translate(${moveX}px, ${moveY}px) scale(1)`;
            }
            // Update 90% keyframe
             const keyframe90 = keyframesRule.findRule('90%');
             if (keyframe90) {
                 keyframe90.style.transform = `translate(${moveX}px, ${moveY}px) scale(1)`;
             }
             // Update 100% keyframe
             const keyframe100 = keyframesRule.findRule('100%');
             if (keyframe100) {
                 keyframe100.style.transform = `translate(${moveX}px, ${moveY}px) scale(1)`;
             }

        } else {
            console.warn("Could not find @keyframes hand-guidance rule.");
        }
    } catch (e) {
        console.error("Error accessing or modifying CSS rules:", e);
        // Fallback or alternative method might be needed if CSSOM modification fails (e.g., CORS issues with external CSS)
    }


    // Make elements visible
    handElement.style.display = 'block';
    instructionElement.style.display = 'block';
    setTimeout(() => { // Allow display block to render before adding class for transition
        handElement.classList.add('visible');
        instructionElement.classList.add('visible');
    }, 50);

    // Add animation class after a short delay
    setTimeout(() => {
        // Change circle to outline after delay (20% of 5s = 1000ms) + initial delay (500ms) = 1500ms
        setTimeout(() => {
            handElement.classList.add('grabbing'); // Add class to change style
        }, 1000); // Updated delay to 1000ms (20% of 5s)

        handElement.classList.add('animate');
        
        // Hide elements after animation finishes (5s duration + 0.5s delay)
        setTimeout(() => {
            handElement.classList.remove('visible');
            instructionElement.classList.remove('visible');
            // Optionally remove elements from DOM or set display none after transition
            setTimeout(() => {
                handElement.style.display = 'none';
                instructionElement.style.display = 'none';
                 handElement.classList.remove('animate'); // Clean up animation class
                 handElement.classList.remove('grabbing'); // Reset style class
            }, 500); // Match CSS transition duration
        }, 5500); // Updated delay to 5500ms (5s duration + 0.5s delay)

    }, 500); // Start animation slightly after appearing
}

function checkAndRunOnboarding() {
    try {
        if (localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
            console.log("User has visited before. Skipping onboarding animation.");
            return; // Already visited
        } else {
            console.log("First visit detected. Running onboarding animation.");
            localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
            runOnboardingAnimation();
        }
    } catch (e) {
        console.error("LocalStorage access error:", e);
        // Decide if animation should run if localStorage fails (e.g., private browsing)
        // For now, let's run it if we can't check.
        runOnboardingAnimation();
    }
}
// --- End Onboarding Logic ---

document.addEventListener('DOMContentLoaded', () => {
    checkAndRunOnboarding(); // Check and run onboarding on load
    
    const shirts = document.querySelectorAll('.shirt');
    const ratImage = document.getElementById('ratImage');
    const shirtNameElement = document.getElementById('shirt-name');
    const infoTooltip = document.getElementById('info-tooltip'); // Get tooltip span
    const getFreeButton = document.querySelector('.get-free-button');

    // Model Info Constants
    const MODEL_INFO = {
        rat: { height: '5ft 10"' },
        mouse: { height: '5ft 4"' }
    };

    // Modal elements
    const modalOverlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('emailModal');
    const modalRatImage = document.getElementById('modalRatImage');
    const modalShirtName = document.getElementById('modalShirtName');
    const closeButton = document.getElementById('modalCloseButton'); // Changed ID
    const modalCloseX = document.getElementById('modalCloseX'); // Get the X button

    // Rat/Mouse Toggle Elements
    const ratMouseToggle = document.getElementById('ratMouseToggle');
    let currentMode = 'mouse'; // Initial mode set to mouse

    // Image Mappings (Reversed)
    const imageMap = {
        // Maps Rat (M) images to Mouse (original) images
        ratToMouse: {
            '/1RatM.png': '/1Rat.png', 
            '/3RatM.png': '/3Rat.png',
            '/6RatM.png': '/6Rat.png',
            '/1RatHoverM.png': '/1RatHover.png',
            '/3RatHoverM.png': '/3RatHover.png',
            '/6RatHoverM.png': '/6RatHover.png'
        },
        // Maps Mouse (original) images to Rat (M) images
        mouseToRat: {
            '/1Rat.png': '/1RatM.png',
            '/3Rat.png': '/3RatM.png',
            '/6Rat.png': '/6RatM.png',
            '/1RatHover.png': '/1RatHoverM.png',
            '/3RatHover.png': '/3RatHoverM.png',
            '/6RatHover.png': '/6RatHoverM.png'
        }
    };
    const validHoverPaths = [
        '/1RatHover.png', '/3RatHover.png', '/6RatHover.png',
        '/1RatHoverM.png', '/3RatHoverM.png', '/6RatHoverM.png'
    ];

    // Slide-to-buy elements (added)
    const sliderContainer = document.getElementById('slide-to-buy-container');
    const sliderHandle = document.getElementById('slider-handle');
    const sliderFill = document.getElementById('slider-fill'); // Added fill element

    // Drag state variables (added for slider)
    let isSliderDragging = false;
    let sliderStartX = 0;
    let sliderStartLeft = 0;
    const sliderPadding = 5; // Match CSS padding/initial offset

    let activeShirt = null;
    let initialShirtPos = { left: '', top: '' };
    let initialTouchPos = { x: 0, y: 0 };
    let currentPos = { x: 0, y: 0 };
    let lastX = 0;
    let lastY = 0;
    let isMoving = false;
    let moveTimeout;
    let originalRatSrc = ''; // Store original rat image source
    let isHoveringRat = false; // Track if currently hovering the rat with the specific shirt
    // We will now determine hover source dynamically based on the current rat image

    // --- Tooltip Update Function ---
    function findShirtElementByName(name) {
        for (const shirt of shirts) {
            if (shirt.getAttribute('data-shirt-name') === name) {
                return shirt;
            }
        }
        return null; // Not found
    }

    function updateTooltip(mode) {
        if (!infoTooltip || !shirtNameElement) return;

        const shirtName = shirtNameElement.textContent;
        let tooltipText = '';

        if (mode === 'mouse') {
            tooltipText = `Model is ${MODEL_INFO.mouse.height} and wears size S`;
        } else if (mode === 'rat') {
            const shirtElement = findShirtElementByName(shirtName);
            // Default to L if shirt not found or no attr specifically for the Rat mode
            const ratModelSize = shirtElement ? shirtElement.getAttribute('data-model-size') || 'L' : 'L'; 
            tooltipText = `Model is ${MODEL_INFO.rat.height} and wears size ${ratModelSize}`;
        } else {
            console.error("Unknown mode for tooltip:", mode);
            return; 
        }

        infoTooltip.setAttribute('data-tooltip', tooltipText);
    }

    shirts.forEach(shirt => {
        shirt.style.cursor = 'grab';
        
        // Mobile touch events
        shirt.addEventListener('touchstart', (e) => {
            handleStart(e); 
        }, { passive: false });
        // Desktop mouse events
        shirt.addEventListener('mousedown', (e) => {
            handleStart(e);
        });
    });

    function handleStart(e) {
        e.preventDefault();
        activeShirt = e.target;
        originalRatSrc = ratImage.src; // Store the CURRENT rat image source (could be Rat or Mouse)
        isHoveringRat = false; // Reset hover state

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

        // Check for collision with rat for hover effect
        const shirtRect = activeShirt.getBoundingClientRect();
        const ratRect = ratImage.getBoundingClientRect();
        const collision = !(shirtRect.right < ratRect.left || 
                          shirtRect.left > ratRect.right || 
                          shirtRect.bottom < ratRect.top || 
                          shirtRect.top > ratRect.bottom);

        if (collision) {
            const currentBaseSrc = originalRatSrc; // Use the src from when drag started
            const currentDisplaySrc = ratImage.src;

            // Determine expected hover suffix based on CURRENT mode
            const hoverSuffix = currentMode === 'rat' ? 'HoverM.png' : 'Hover.png';
            const isAlreadyHovering = currentDisplaySrc.endsWith(hoverSuffix);
            
            if (!isAlreadyHovering) {
                // Extract base name (e.g., /1Rat or /1RatM)
                let baseNameWithMaybeM = currentBaseSrc.substring(currentBaseSrc.lastIndexOf('/'), currentBaseSrc.lastIndexOf('.png'));
                // Ensure we get the core name like /1Rat to construct hover path
                let coreBaseName = baseNameWithMaybeM.replace('M', ''); 

                const potentialHoverPath = coreBaseName + hoverSuffix;

                // Check if this hover path is valid
                if (validHoverPaths.includes(potentialHoverPath)) {
                    // Use URL constructor for correct path relative to document
                    ratImage.src = new URL(potentialHoverPath, window.location.href).pathname;
                    isHoveringRat = true;
                }
            }
        } else {
            if (isHoveringRat) {
                ratImage.src = originalRatSrc; // Revert to original image (Rat or Mouse version)
                isHoveringRat = false;
            }
        }

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

        // Check for collision with rat on drop
        const shirtRect = activeShirt.getBoundingClientRect();
        const ratRect = ratImage.getBoundingClientRect();

        // Calculate the center of the shirt
        const shirtCenterX = shirtRect.left + shirtRect.width / 2;
        const shirtCenterY = shirtRect.top + shirtRect.height / 2;

        // Check if the center of the shirt is within the rat's bounding box
        const collision = shirtCenterX >= ratRect.left &&
                          shirtCenterX <= ratRect.right &&
                          shirtCenterY >= ratRect.top &&
                          shirtCenterY <= ratRect.bottom;

        if (collision) {
            const newRatSrc = activeShirt.getAttribute('data-rat-src');
            if (newRatSrc) {
                ratImage.src = newRatSrc; // Set final image (overwrites hover if necessary)

                // Update the shirt name text using the data attribute
                const shirtName = activeShirt.getAttribute('data-shirt-name');
                if (shirtName) {
                    shirtNameElement.textContent = shirtName;
                } else {
                    // Fallback if data attribute is missing
                    shirtNameElement.textContent = 'Unknown Shirt'; 
                }

                // Update tooltip text based on new shirt and current mode
                updateTooltip(currentMode);

                // Reset position
                activeShirt.style.left = initialShirtPos.left;
                activeShirt.style.top = initialShirtPos.top;
                currentPos.x = parseInt(initialShirtPos.left) || 0;
                currentPos.y = parseInt(initialShirtPos.top) || 0;
            }
        } else {
             // No collision (drop elsewhere or cancelled)
             // Reset shirt position
            activeShirt.style.left = initialShirtPos.left;
            activeShirt.style.top = initialShirtPos.top;
            currentPos.x = parseInt(initialShirtPos.left) || 0;
            currentPos.y = parseInt(initialShirtPos.top) || 0;

            // Ensure rat image is reverted if hover was active
            if (isHoveringRat) {
                ratImage.src = originalRatSrc;
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

        isHoveringRat = false; // Ensure hover state is reset
        activeShirt = null;
    }

    // --- Rat/Mouse Toggle Logic ---
    if (ratMouseToggle) {
        ratMouseToggle.addEventListener('change', (e) => {
            const isMouseMode = e.target.checked; // true if switching TO Mouse (original images)
            const newMode = isMouseMode ? 'mouse' : 'rat';
            currentMode = newMode; // Update global mode state

            console.log(`Switched mode to: ${currentMode}`);

            const conversionMap = isMouseMode ? imageMap.ratToMouse : imageMap.mouseToRat;
            const currentRatPath = new URL(ratImage.src).pathname;
            const newRatPath = conversionMap[currentRatPath] || currentRatPath; 

            // Function to run after fade-out completes
            const changeImageAndTooltip = () => {
                console.log(`Changing src to: ${newRatPath}`);
                ratImage.src = newRatPath; // Change the source
                ratImage.style.opacity = 1; // Fade back in
                
                // Update tooltip after image source is confirmed changed
                updateTooltip(currentMode);

                // Clean up the listener
                ratImage.removeEventListener('transitionend', changeImageAndTooltip);
            };

            // Only transition if the path is actually changing
            if (newRatPath !== currentRatPath) {
                // Add a one-time listener for the end of the fade-out transition
                ratImage.addEventListener('transitionend', changeImageAndTooltip, { once: true });

                // Start the fade-out
                ratImage.style.opacity = 0;
                 
            } else {
                 console.warn(`No counterpart found or same image, no transition: ${currentRatPath} in map:`, conversionMap);
                 // Update tooltip immediately if no visual transition
                 updateTooltip(currentMode);
            }
           
            // Update shirt data attributes (no transition needed here)
            shirts.forEach(shirt => {
                const currentDataSrc = shirt.getAttribute('data-rat-src');
                const newDataSrc = conversionMap[currentDataSrc] || currentDataSrc;
                 if (newDataSrc !== currentDataSrc) {
                    shirt.setAttribute('data-rat-src', newDataSrc);
                 } 
                 // Removed console warning spam for data-src lookup failure
            });
        });
    } else {
        console.warn('Rat/Mouse toggle checkbox not found!');
    }

    // --- Modal Opening Logic --- 
    // Extracted function to be called by button OR slider
    function openEmailModal() {
        const currentShirtName = shirtNameElement.textContent;
        const currentRatSrc = ratImage.src;

        modalShirtName.textContent = currentShirtName; // Update modal shirt name
        modalRatImage.src = currentRatSrc; // Update modal rat image

        // Simplified: Just display the modal
        modalOverlay.style.display = 'flex';
        // Disable body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }

    // Event listener for the original button (commented out as button is removed)
    /*
    if (getFreeButton) {
        getFreeButton.addEventListener('click', openEmailModal);
    } else {
        console.error("Get Free Button not found");
    }
    */

    // --- Modal Closing Logic ---
    function closeModal() {
        modalOverlay.style.display = 'none';
        // Re-enable body scroll when modal is closed
        document.body.style.overflow = ''; 
    }

    // Handle close button click (adjusted for new button ID)
    if (closeButton) { // Check if button exists
      closeButton.addEventListener('click', closeModal);
    } else {
      console.error("Modal Close Button not found");
    }

    // Handle X button click (remains the same)
    modalCloseX.addEventListener('click', closeModal);

    // Optional: Close modal if clicking outside the modal content
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });

    // --- Slide to Buy Logic (Added) ---
    if (sliderHandle && sliderContainer) {
        sliderHandle.addEventListener('mousedown', handleSliderStart);
        sliderHandle.addEventListener('touchstart', handleSliderStart, { passive: false });
    } else {
        console.error('Slider elements not found!');
    }

    function handleSliderStart(e) {
        isSliderDragging = true;
        sliderHandle.classList.add('dragging');
        sliderContainer.classList.add('dragging'); // Add class to container
        sliderHandle.style.transition = 'none'; // Disable transition during drag

        if (e.type === 'mousedown') {
            sliderStartX = e.clientX;
            document.addEventListener('mousemove', handleSliderMove);
            document.addEventListener('mouseup', handleSliderEnd);
        } else { // touchstart
            e.preventDefault(); // Prevent page scroll
            sliderStartX = e.touches[0].clientX;
            document.addEventListener('touchmove', handleSliderMove, { passive: false });
            document.addEventListener('touchend', handleSliderEnd);
            document.addEventListener('touchcancel', handleSliderEnd);
        }

        // Use offsetLeft for reliable initial position
        sliderStartLeft = sliderHandle.offsetLeft; 
    }

    function handleSliderMove(e) {
        if (!isSliderDragging) return;
        e.preventDefault(); // Prevent selection/scrolling

        let currentX;
        if (e.type === 'mousemove') {
            currentX = e.clientX;
        } else { // touchmove
            currentX = e.touches[0].clientX;
        }

        const deltaX = currentX - sliderStartX;
        let newLeft = sliderStartLeft + deltaX;

        // Clamp position within bounds
        const minLeft = sliderPadding;
        const maxLeft = sliderContainer.offsetWidth - sliderHandle.offsetWidth - sliderPadding;
        newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));

        sliderHandle.style.left = `${newLeft}px`;

        // Update fill width - relative to the handle's center
        const handleCenter = newLeft + sliderHandle.offsetWidth / 2;
        const fillWidthPercentage = (handleCenter / sliderContainer.offsetWidth) * 100;
        if (sliderFill) {
            sliderFill.style.width = `${Math.min(fillWidthPercentage, 100)}%`;
        }
    }

    function handleSliderEnd(e) {
        if (!isSliderDragging) return;
        isSliderDragging = false;
        sliderHandle.classList.remove('dragging');
        sliderContainer.classList.remove('dragging'); // Remove class from container
        sliderHandle.style.transition = 'left 0.2s ease-out'; // Re-enable transition for snap back
        sliderHandle.style.transform = 'scale(1)'; // Reset scale
        sliderHandle.style.boxShadow = ''; // Reset shadow

        if (e.type === 'mousemove') {
            document.removeEventListener('mousemove', handleSliderMove);
            document.removeEventListener('mouseup', handleSliderEnd);
        } else { // touchend/touchcancel
            document.removeEventListener('touchmove', handleSliderMove);
            document.removeEventListener('touchend', handleSliderEnd);
            document.removeEventListener('touchcancel', handleSliderEnd);
        }

        // Check if slid far enough
        const endThreshold = sliderContainer.offsetWidth - sliderHandle.offsetWidth - sliderPadding - 5; // 5px tolerance

        if (sliderHandle.offsetLeft >= endThreshold) {
            // Success! Trigger the modal.
            console.log('Slide successful!');
            openEmailModal(); 
            // Snap back slightly delayed, reset fill quickly
            if (sliderFill) sliderFill.style.width = '100%'; // Fill completely on success briefly
            setTimeout(() => {
                sliderHandle.style.left = `${sliderPadding}px`; 
                if (sliderFill) sliderFill.style.width = '0px'; // Reset fill on snap back
            }, 150); // Increased delay slightly
        } else {
            // Didn't slide far enough, snap back.
            sliderHandle.style.left = `${sliderPadding}px`;
            if (sliderFill) sliderFill.style.width = '0px'; // Reset fill on snap back
        }
    }
    // --- End Slide to Buy Logic ---

    // --- Tooltip Click Listener --- 
    if (infoTooltip) {
        infoTooltip.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from immediately closing via document listener
            infoTooltip.classList.toggle('tooltip-visible');
        });

        // Add listener to close tooltip when clicking elsewhere
        document.addEventListener('click', (event) => {
            // Check if the tooltip is visible and the click was outside the tooltip
            if (infoTooltip.classList.contains('tooltip-visible') && !infoTooltip.contains(event.target)) {
                infoTooltip.classList.remove('tooltip-visible');
            }
        });
    } else {
        console.error('Info Tooltip element not found');
    }

    // --- Initial Setup --- 
    // Set initial tooltip based on default mode and shirt
    updateTooltip(currentMode);

}); 