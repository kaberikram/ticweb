document.addEventListener('DOMContentLoaded', () => {
    const shirts = document.querySelectorAll('.shirt');
    const ratImage = document.getElementById('ratImage');
    
    let activeShirt = null;
    let initialShirtPos = { left: '', top: '' };
    let initialTouchPos = { x: 0, y: 0 };
    let currentPos = { x: 0, y: 0 };
    let lastX = 0;
    let lastY = 0;
    let isMoving = false;
    let moveTimeout;

    shirts.forEach(shirt => {
        shirt.style.cursor = 'grab';
        
        // Mobile touch events
        shirt.addEventListener('touchstart', handleStart, { passive: false });
        // Desktop mouse events
        shirt.addEventListener('mousedown', handleStart);
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
}); 