/**
 * Auto-Detecting Gallery System
 * Automatically detects image orientation and applies correct styling
 * 
 * Usage: Just add images with data-src attribute, orientation is auto-detected!
 */

(function() {
    'use strict'
    
    // Aspect ratio thresholds (width/height ratio)
    const ASPECT_RATIO_THRESHOLDS = {
        landscape: 1.2,  // Wider than tall (16:9, 4:3, etc.)
        portrait: 0.8,   // Taller than wide (9:16, 3:4, etc.)
        // Between 0.8-1.2 is considered square-ish
    }
    
    // Standard dimensions for gallery items
    const DIMENSIONS = {
        landscape: {
            width: 609,
            height: 343,
            class: 'item-16-9'
        },
        portrait: {
            width: 297.58,
            height: 529,
            class: 'item-9-16'
        },
        square: {
            width: 400,
            height: 400,
            class: 'item-1-1'
        }
    }
    
    /**
     * Detect image orientation from natural dimensions
     * @param {HTMLImageElement} img - Image element
     * @returns {string} - 'landscape', 'portrait', or 'square'
     */
    function detectOrientation(img) {
        if (!img.naturalWidth || !img.naturalHeight) {
            // If image hasn't loaded yet, return default
            return 'landscape'
        }
        
        const ratio = img.naturalWidth / img.naturalHeight
        
        if (ratio > ASPECT_RATIO_THRESHOLDS.landscape) {
            return 'landscape'
        } else if (ratio < ASPECT_RATIO_THRESHOLDS.portrait) {
            return 'portrait'
        } else {
            return 'square'
        }
    }
    
    /**
     * Apply correct styling based on detected orientation
     * @param {HTMLElement} item - Gallery item container
     * @param {HTMLImageElement} img - Image element
     */
    function applyOrientationStyles(item, img) {
        const orientation = detectOrientation(img)
        const dims = DIMENSIONS[orientation]
        
        // Remove existing orientation classes
        item.classList.remove('item-16-9', 'item-9-16', 'item-1-1')
        
        // Add correct class
        item.classList.add(dims.class)
        
        // Store orientation in data attribute for reference
        item.dataset.orientation = orientation
        item.dataset.aspectRatio = (img.naturalWidth / img.naturalHeight).toFixed(2)
        
        console.log(`Image "${img.alt}" detected as ${orientation} (${item.dataset.aspectRatio}:1)`)
    }
    
    /**
     * Initialize auto-detection for a single gallery item
     * @param {HTMLElement} item - Gallery item container
     */
    function initGalleryItem(item) {
        const img = item.querySelector('img')
        
        if (!img) {
            console.warn('Gallery item missing image element')
            return
        }
        
        // If image is already loaded
        if (img.complete && img.naturalWidth > 0) {
            applyOrientationStyles(item, img)
            return
        }
        
        // Wait for image to load
        img.addEventListener('load', function onLoad() {
            applyOrientationStyles(item, img)
            img.removeEventListener('load', onLoad)
        }, { once: true })
        
        // Handle load errors
        img.addEventListener('error', function onError() {
            console.error(`Failed to load image: ${img.src}`)
            img.removeEventListener('error', onError)
        }, { once: true })
    }
    
    /**
     * Initialize all gallery items
     */
    function initGallery() {
        const galleryItems = document.querySelectorAll('.gallery-item[data-auto-orient]')
        
        if (galleryItems.length === 0) {
            console.log('No auto-orient gallery items found')
            return
        }
        
        console.log(`Initializing ${galleryItems.length} gallery items with auto-orientation`)
        
        galleryItems.forEach((item, index) => {
            // Set data-index if not already set
            if (!item.dataset.index) {
                item.dataset.index = index + 1
            }
            
            initGalleryItem(item)
        })
    }
    
    /**
     * Add a new gallery item dynamically
     * @param {string} src - Image source path
     * @param {string} alt - Alt text
     * @param {string} containerSelector - Gallery container selector
     */
    function addGalleryItem(src, alt = 'Gallery image', containerSelector = '#galleryScroll') {
        const container = document.querySelector(containerSelector)
        
        if (!container) {
            console.error(`Gallery container "${containerSelector}" not found`)
            return null
        }
        
        // Create gallery item
        const item = document.createElement('div')
        item.className = 'gallery-item'
        item.setAttribute('data-auto-orient', 'true')
        
        // Create image
        const img = document.createElement('img')
        img.src = src
        img.alt = alt
        img.loading = 'lazy'
        
        item.appendChild(img)
        
        // Insert before spacer
        const spacer = container.querySelector('.gallery-spacer')
        if (spacer) {
            container.insertBefore(item, spacer)
        } else {
            container.appendChild(item)
        }
        
        // Initialize orientation detection
        initGalleryItem(item)
        
        console.log(`Added gallery item: ${src}`)
        return item
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGallery)
    } else {
        initGallery()
    }
    
    // Expose API globally
    window.GalleryAuto = {
        init: initGallery,
        addItem: addGalleryItem,
        detectOrientation: detectOrientation,
    }
    
    console.log('Gallery auto-orientation system loaded')
})()

