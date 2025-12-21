/**
 * Vertical to Horizontal Scroll Converter
 * Converts vertical scroll/touch gestures to horizontal scrolling
 * while preserving existing horizontal scroll functionality
 */

(function() {
    'use strict'
    
    // Configuration
    const CONFIG = {
        containerSelector: '#galleryContainer',
        scrollSpeed: 1.0, // Multiplier for scroll speed (adjust for sensitivity)
        smoothScroll: true,
    }
    
    let container = null
    let isScrolling = false
    
    /**
     * Handle wheel events (mouse wheel, trackpad)
     */
    function handleWheel(e) {
        if (!container) return
        
        // Calculate scroll deltas
        const deltaX = e.deltaX || 0
        const deltaY = e.deltaY || 0
        
        // Check if vertical scroll is dominant
        const isVerticalScroll = Math.abs(deltaY) > Math.abs(deltaX)
        
        // If vertical scroll detected, convert to horizontal
        if (isVerticalScroll && Math.abs(deltaY) > 0) {
            // Prevent default vertical scrolling
            e.preventDefault()
            
            // Convert vertical scroll to horizontal
            const scrollAmount = deltaY * CONFIG.scrollSpeed
            
            if (CONFIG.smoothScroll) {
                // Smooth scroll
                container.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                })
            } else {
                // Instant scroll
                container.scrollLeft += scrollAmount
            }
            
            return false
        }
        
        // Allow horizontal scrolling to work normally
        return true
    }
    
    /**
     * Handle touch events for mobile
     */
    let touchStartX = 0
    let touchStartY = 0
    let touchStartScrollLeft = 0
    
    function handleTouchStart(e) {
        if (!container) return
        
        const touch = e.touches[0]
        touchStartX = touch.clientX
        touchStartY = touch.clientY
        touchStartScrollLeft = container.scrollLeft
    }
    
    function handleTouchMove(e) {
        if (!container) return
        
        const touch = e.touches[0]
        const deltaX = touch.clientX - touchStartX
        const deltaY = touch.clientY - touchStartY
        
        // Check if vertical swipe is dominant
        const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX)
        
        // If vertical swipe, convert to horizontal scroll
        if (isVerticalSwipe && Math.abs(deltaY) > 10) {
            e.preventDefault()
            
            // Convert vertical movement to horizontal scroll
            const scrollDelta = deltaY * CONFIG.scrollSpeed
            container.scrollLeft = touchStartScrollLeft - scrollDelta
            
            return false
        }
        
        // Allow horizontal touch scrolling to work normally
        return true
    }
    
    /**
     * Initialize scroll converter
     */
    function init() {
        container = document.querySelector(CONFIG.containerSelector)
        
        if (!container) {
            console.warn('Gallery container not found for scroll converter')
            return
        }
        
        // Add wheel event listener (with passive: false to allow preventDefault)
        container.addEventListener('wheel', handleWheel, { passive: false })
        
        // Add touch event listeners for mobile
        container.addEventListener('touchstart', handleTouchStart, { passive: true })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        
        console.log('Vertical to horizontal scroll converter initialized')
    }
    
    /**
     * Cleanup
     */
    function destroy() {
        if (!container) return
        
        container.removeEventListener('wheel', handleWheel)
        container.removeEventListener('touchstart', handleTouchStart)
        container.removeEventListener('touchmove', handleTouchMove)
        
        container = null
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
    } else {
        init()
    }
    
    // Expose API
    window.GalleryScrollConverter = {
        init,
        destroy,
        config: CONFIG,
    }
    
})()

