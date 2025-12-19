const galleryContainer = document.getElementById('galleryContainer')
const galleryScroll = document.getElementById('galleryScroll')

// Detect if mobile (using 768px breakpoint like CSS)
function isMobile() {
    return window.innerWidth < 768
}

// --- Scale Constants based on your new request ---
const SCALE_START = 1.3
const SCALE_MID = 1.7
const SCALE_END = 0.8

// Original transition point (e.g., ~1331px)
const TRANSITION_END_POINT = 64 + 609 + 106 + 297.58 + 106 + 148.79
// New transition point for the 1.3 -> 1.7 phase. Using 1/4 of the total distance.
// Adjust this fraction (0.25) if you want the 1.7 peak sooner or later.
const TRANSITION_MID_POINT = TRANSITION_END_POINT * 0.25 

function updateZoom() {
    const currentScrollLeft = galleryContainer.scrollLeft
    const mobile = isMobile()
    
    let scale
    
    if (currentScrollLeft <= TRANSITION_MID_POINT) {
        // Phase 1: Interpolate from SCALE_START (1.3) to SCALE_MID (1.7)
        const progress = Math.min(currentScrollLeft / TRANSITION_MID_POINT, 1)
        const scaleRange = SCALE_MID - SCALE_START
        scale = SCALE_START + (progress * scaleRange)
        
    } else if (currentScrollLeft <= TRANSITION_END_POINT) {
        // Phase 2: Interpolate from SCALE_MID (1.7) to SCALE_END (0.8)
        
        // Calculate progress through the second phase only
        const phase2Distance = TRANSITION_END_POINT - TRANSITION_MID_POINT
        const scrollInPhase2 = currentScrollLeft - TRANSITION_MID_POINT
        
        const progress = Math.min(scrollInPhase2 / phase2Distance, 1)
        const scaleRange = SCALE_MID - SCALE_END
        
        // Scale starts at SCALE_MID and decreases
        scale = SCALE_MID - (progress * scaleRange)
        
    } else {
        // Phase 3: Stay at SCALE_END (0.8) after the final transition point
        scale = SCALE_END
    }
    
    galleryScroll.style.transform = `scale(${scale})`
}

// Set initial scale based on device (using 1.3 for non-mobile)
const initialScaleOnLoad = isMobile() ? 1.5 : SCALE_START
galleryScroll.style.transform = `scale(${initialScaleOnLoad})`

galleryContainer.addEventListener('scroll', updateZoom)


// Update on resize to recalculate if needed
window.addEventListener('resize', function() {
    updateZoom()
    updatePreviousCollectionVisibility()
    // Reset initial scale on resize if at the very start
    const newInitialScaleOnLoad = isMobile() ? 1.5 : SCALE_START
    if (galleryContainer.scrollLeft === 0) {
        galleryScroll.style.transform = `scale(${newInitialScaleOnLoad})`
    }
})
