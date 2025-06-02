import '/mouselog.css'; // Import the mouselog specific stylesheet
import { inject } from "@vercel/analytics";

inject();

// --- Image Preloading Function ---
function preloadImages(imageArray) {
    const preloadedImages = [];
    for (let i = 0; i < imageArray.length; i++) {
        const img = new Image();
        img.src = imageArray[i];
        preloadedImages.push(img);
    }
}
// --- End Image Preloading Function ---

// --- Onboarding Logic REMOVED ---
// function runOnboardingAnimation() { ... }

document.addEventListener('DOMContentLoaded', () => {
    // runOnboardingAnimation(); // Call is already commented out
    
    const shirts = document.querySelectorAll('.shirt');
    const centerImage = document.getElementById('centerImage'); 
    // const stylingCanvasTitle = document.getElementById('styling-canvas-title'); // REMOVED
    const infoTooltip = document.getElementById('info-tooltip');

    const MODEL_INFO = {
        mouse: { height: '5ft 4"' } 
    };

    let currentMode = 'mouse'; 
    const validHoverPaths = [];

    const imagePaths = [];
    shirts.forEach(shirt => {
        const shirtSrc = shirt.getAttribute('src');
        const mouseSrc = shirt.getAttribute('data-mouse-src');
        
        if (shirtSrc) imagePaths.push(shirtSrc);
        if (mouseSrc) {
            imagePaths.push(mouseSrc);
            const hoverSrc = mouseSrc.replace('Rat.png', 'RatHover.png');
            if (hoverSrc !== mouseSrc) { 
                 imagePaths.push(hoverSrc);
                 try {
                    validHoverPaths.push(new URL(hoverSrc, window.location.href).pathname);
                 } catch (e) {
                    console.warn(`Could not create URL for hover image: ${hoverSrc}`, e)
                 }
            }
        }
    });
    
    if (centerImage && centerImage.src) {
        imagePaths.push(centerImage.src);
    }
        
    const uniqueImagePaths = [...new Set(imagePaths)].map(path => {
        if (!path) return null;
        try {
            return new URL(path, window.location.href).pathname;
        } catch (e) {
            console.warn('Error converting path to URL:', path, e);
            return path; 
        }
    }).filter(Boolean); 
    
    preloadImages(uniqueImagePaths);

    let activeShirt = null;
    let initialShirtPos = { left: '', top: '' };
    let initialTouchPos = { x: 0, y: 0 };
    let currentPos = { x: 0, y: 0 };
    let lastX = 0;
    let lastY = 0;
    let isMoving = false;
    let moveTimeout;
    let originalCenterImageSrc = ''; // Will store the full URL of the base image
    let isHoveringCenterImage = false; 

    function findShirtElementByName(name) {
        for (const shirt of shirts) {
            if (shirt.getAttribute('data-shirt-name') === name) {
                return shirt;
            }
        }
        return null; 
    }

    function updateTooltip() { 
        if (!infoTooltip || !MODEL_INFO.mouse) return;
        const tooltipText = `Model is ${MODEL_INFO.mouse.height} and wears size S`;
        infoTooltip.setAttribute('data-tooltip', tooltipText);
    }

    shirts.forEach(shirt => {
        shirt.style.cursor = 'grab';
        shirt.addEventListener('touchstart', (e) => { handleStart(e); }, { passive: false });
        shirt.addEventListener('mousedown', (e) => { handleStart(e); });
    });

    function handleStart(e) {
        e.preventDefault();
        activeShirt = e.target;
        // Capture and normalize the original image on centerImage to its base version URL
        if (centerImage && centerImage.src) {
            let currentCenterSrcURL;
            try {
                currentCenterSrcURL = new URL(centerImage.src, window.location.href);
            } catch(urlError) {
                console.warn("Error parsing centerImage.src in handleStart:", urlError);
                // Fallback if current src is somehow invalid, keep it as is
                originalCenterImageSrc = centerImage.src;
                isHoveringCenterImage = false; 
                return; // Early exit if we can't parse the URL
            }
            
            const currentCenterPath = currentCenterSrcURL.pathname;
            const hoverSuffix = 'RatHover.png';
            const baseSuffix = 'Rat.png';

            if (currentCenterPath.endsWith(hoverSuffix)) {
                const basePath = currentCenterPath.replace(hoverSuffix, baseSuffix);
                try {
                    originalCenterImageSrc = new URL(basePath, window.location.href).href;
                } catch (normalizationError) {
                    console.warn("Error creating URL for normalized base image in handleStart:", normalizationError);
                    originalCenterImageSrc = currentCenterSrcURL.href; // Fallback to unnormalized URL
                }
            } else {
                originalCenterImageSrc = currentCenterSrcURL.href; // It's already a base image or unknown, keep its full URL
            }
        } else if (centerImage) {
            originalCenterImageSrc = ''; // Fallback if centerImage has no src
        }
        
        isHoveringCenterImage = false; 

        const computedStyle = window.getComputedStyle(activeShirt);
        initialShirtPos.left = computedStyle.left || '0px';
        initialShirtPos.top = computedStyle.top || '0px';
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
        if (!activeShirt || !centerImage) return;
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
        const deltaX = clientX - lastX;
        const deltaY = clientY - lastY;
        currentPos.x += deltaX;
        currentPos.y += deltaY;
        activeShirt.style.left = `${currentPos.x}px`;
        activeShirt.style.top = `${currentPos.y}px`;

        const shirtRect = activeShirt.getBoundingClientRect();
        const centerImageRect = centerImage.getBoundingClientRect();
        const collision = !(shirtRect.right < centerImageRect.left || 
                          shirtRect.left > centerImageRect.right || 
                          shirtRect.bottom < centerImageRect.top || 
                          shirtRect.top > centerImageRect.bottom);

        if (collision) {
            const currentDisplaySrcPath = new URL(centerImage.src, window.location.href).pathname;
            const hoverSuffix = 'RatHover.png';
            const isAlreadyHovering = currentDisplaySrcPath.endsWith(hoverSuffix);
            
            if (!isAlreadyHovering && originalCenterImageSrc) { // Only change if not already hovering, and we have an original
                let baseImageToHoverPath;
                try {
                    baseImageToHoverPath = new URL(originalCenterImageSrc, window.location.href).pathname;
                } catch (urlError) {
                    console.warn("Error parsing originalCenterImageSrc in handleMove:", urlError);
                    baseImageToHoverPath = '';
                }

                if (baseImageToHoverPath.endsWith('Rat.png')) { // Ensure it's a hoverable type
                    const potentialHoverPathForOriginal = baseImageToHoverPath.replace('Rat.png', hoverSuffix);
                    // validHoverPaths contains absolute pathnames
                    if (validHoverPaths.includes(potentialHoverPathForOriginal)) {
                        centerImage.src = potentialHoverPathForOriginal; // Set src using the absolute path
                        isHoveringCenterImage = true;
                    }
                }
            }
        } else {
            if (isHoveringCenterImage && originalCenterImageSrc) { // Ensure originalCenterImageSrc is not empty
                centerImage.src = originalCenterImageSrc;
                isHoveringCenterImage = false;
            }
        }

        const isMovingNow = Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2;
        if (isMovingNow && !isMoving) {
            activeShirt.classList.remove('grabbed');
            activeShirt.classList.add(deltaX > 0 ? 'dragging-right' : 'dragging-left');
            isMoving = true;
        } else if (isMoving && deltaX !== 0) {
            activeShirt.classList.remove('dragging-right', 'dragging-left');
            activeShirt.classList.add(deltaX > 0 ? 'dragging-right' : 'dragging-left');
        }
        lastX = clientX;
        lastY = clientY;
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
        if (!activeShirt || !centerImage) return;
        const shirtRect = activeShirt.getBoundingClientRect();
        const centerImageRect = centerImage.getBoundingClientRect();
        const shirtCenterX = shirtRect.left + shirtRect.width / 2;
        const shirtCenterY = shirtRect.top + shirtRect.height / 2;
        const collision = shirtCenterX >= centerImageRect.left &&
                          shirtCenterX <= centerImageRect.right &&
                          shirtCenterY >= centerImageRect.top &&
                          shirtCenterY <= centerImageRect.bottom;

        if (collision) {
            const newImageSrc = activeShirt.getAttribute('data-mouse-src');
            if (newImageSrc) {
                try {
                    const fullPath = new URL(newImageSrc, window.location.href).pathname;
                    centerImage.src = fullPath;
                    originalCenterImageSrc = fullPath; // Update originalCenterImageSrc to the new base image
                } catch(urlError) {
                    console.warn(`Error creating URL for new image source: ${newImageSrc}`, urlError);
                    centerImage.src = newImageSrc;
                    originalCenterImageSrc = newImageSrc; 
                }
                const shirtName = activeShirt.getAttribute('data-shirt-name');
                updateTooltip();
                activeShirt.style.left = initialShirtPos.left;
                activeShirt.style.top = initialShirtPos.top;
                currentPos.x = parseInt(initialShirtPos.left) || 0;
                currentPos.y = parseInt(initialShirtPos.top) || 0;
            }
        } else {
            activeShirt.style.left = initialShirtPos.left;
            activeShirt.style.top = initialShirtPos.top;
            currentPos.x = parseInt(initialShirtPos.left) || 0;
            currentPos.y = parseInt(initialShirtPos.top) || 0;
            if (isHoveringCenterImage && originalCenterImageSrc) { // Ensure originalCenterImageSrc is not empty
                centerImage.src = originalCenterImageSrc;
            }
        }
        activeShirt.style.cursor = 'grab';
        activeShirt.style.zIndex = '';
        activeShirt.classList.remove('dragging-right', 'dragging-left', 'grabbed');
        if (moveTimeout) clearTimeout(moveTimeout);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('touchcancel', handleEnd);
        isHoveringCenterImage = false;
        activeShirt = null;
    }

    if (infoTooltip) {
        infoTooltip.addEventListener('click', (event) => {
            event.stopPropagation(); 
            infoTooltip.classList.toggle('tooltip-visible');
        });
        document.addEventListener('click', (event) => {
            if (infoTooltip.classList.contains('tooltip-visible') && !infoTooltip.contains(event.target)) {
                infoTooltip.classList.remove('tooltip-visible');
            }
        });
    } else {
        console.error('Info Tooltip element not found');
    }

    updateTooltip();

    // Typewriter animation logic for #styling-canvas-title REMOVED
    
}); 