/**
 * Gallery Zoom Controller
 * A configurable, reusable module for scroll-based zoom effects
 */

// Configuration object - easily adjustable settings
const GALLERY_CONFIG = {
    // Selectors
    selectors: {
        container: '#galleryContainer',
        scroll: '#galleryScroll',
    },
    
    // Breakpoints
    breakpoints: {
        mobile: 768,
    },
    
    // Scale settings
    scale: {
        desktop: {
            start: 1.3,
            peak: 1.7,
            end: 0.8,
        },
        mobile: {
            start: 1.5,
            peak: 1.7,
            end: 0.8,
        },
    },
    
    // Transition timing (as percentage of total scroll distance)
    transitions: {
        peakPoint: 0.25, // When scale reaches peak (25% of scroll)
    },
    
    // Gallery item dimensions for calculating scroll distance
    // Can be auto-calculated or manually set
    dimensions: {
        paddingLeft: 64,
        firstImageWidth: 609,
        gap: 106,
        portraitWidth: 297.58,
        calculateEndPoint() {
            return this.paddingLeft + this.firstImageWidth + this.gap + this.portraitWidth + this.gap + (this.portraitWidth / 2)
        },
    },
}

/**
 * Creates a gallery zoom controller
 * @param {Object} config - Configuration options
 * @returns {Object} - Controller interface
 */
function createGalleryZoom(config = GALLERY_CONFIG) {
    // Private state
    let container = null
    let scrollElement = null
    let isInitialized = false
    
    /**
     * Check if current viewport is mobile
     */
    function isMobile() {
        return window.innerWidth < config.breakpoints.mobile
    }
    
    /**
     * Get scale settings based on device type
     */
    function getScaleSettings() {
        return isMobile() ? config.scale.mobile : config.scale.desktop
    }
    
    /**
     * Calculate the scroll end point for transitions
     */
    function getTransitionEndPoint() {
        return config.dimensions.calculateEndPoint()
    }
    
    /**
     * Calculate current scale based on scroll position
     * @param {number} scrollLeft - Current horizontal scroll position
     */
    function calculateScale(scrollLeft) {
        const { start, peak, end } = getScaleSettings()
        const transitionEnd = getTransitionEndPoint()
        const transitionMid = transitionEnd * config.transitions.peakPoint
        
        // Phase 1: Start -> Peak (zoom in)
        if (scrollLeft <= transitionMid) {
            const progress = Math.min(scrollLeft / transitionMid, 1)
            return start + (progress * (peak - start))
        }
        
        // Phase 2: Peak -> End (zoom out)
        if (scrollLeft <= transitionEnd) {
            const phase2Distance = transitionEnd - transitionMid
            const scrollInPhase2 = scrollLeft - transitionMid
            const progress = Math.min(scrollInPhase2 / phase2Distance, 1)
            return peak - (progress * (peak - end))
        }
        
        // Phase 3: Stay at end scale
        return end
    }
    
    /**
     * Apply scale transform to scroll element
     */
    function updateZoom() {
        if (!container || !scrollElement) return
        
        const scale = calculateScale(container.scrollLeft)
        scrollElement.style.transform = `scale(${scale})`
    }
    
    /**
     * Set initial scale
     */
    function setInitialScale() {
        if (!scrollElement) return
        
        const { start } = getScaleSettings()
        scrollElement.style.transform = `scale(${start})`
    }
    
    /**
     * Handle window resize
     */
    function handleResize() {
        if (!container) return
        
        // If at the start, reset to initial scale for new device type
        if (container.scrollLeft === 0) {
            setInitialScale()
        } else {
            updateZoom()
        }
    }
    
    /**
     * Initialize the gallery zoom controller
     */
    function init() {
        if (isInitialized) {
            console.warn('Gallery zoom already initialized')
            return
        }
        
        // Get DOM elements
        container = document.querySelector(config.selectors.container)
        scrollElement = document.querySelector(config.selectors.scroll)
        
        // Guard: ensure elements exist
        if (!container || !scrollElement) {
            console.warn('Gallery elements not found, zoom interaction disabled')
            return
        }
        
        // Set initial scale
        setInitialScale()
        
        // Bind event listeners
        container.addEventListener('scroll', updateZoom, { passive: true })
        window.addEventListener('resize', handleResize, { passive: true })
        
        isInitialized = true
        console.log('Gallery zoom initialized')
    }
    
    /**
     * Cleanup and destroy the controller
     */
    function destroy() {
        if (!isInitialized) return
        
        container?.removeEventListener('scroll', updateZoom)
        window.removeEventListener('resize', handleResize)
        
        container = null
        scrollElement = null
        isInitialized = false
    }
    
    /**
     * Update configuration dynamically
     * @param {Object} newConfig - New configuration options
     */
    function updateConfig(newConfig) {
        Object.assign(config, newConfig)
        if (isInitialized) {
            updateZoom()
        }
    }
    
    // Return public interface
    return {
        init,
        destroy,
        updateConfig,
        updateZoom,
        getScale: () => calculateScale(container?.scrollLeft || 0),
    }
}

// Create and initialize gallery zoom
const galleryZoom = createGalleryZoom()

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => galleryZoom.init())
} else {
    galleryZoom.init()
}

// Export for external use (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createGalleryZoom, GALLERY_CONFIG }
}
