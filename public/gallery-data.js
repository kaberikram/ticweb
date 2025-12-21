/**
 * Gallery Data Configuration
 * Define gallery items in a data structure for easy management
 * 
 * Usage:
 * - Add new images by adding objects to the GALLERY_ITEMS array
 * - Each item can have custom aspect ratio, caption, link, etc.
 * - The gallery renderer will automatically create DOM elements
 */

const GALLERY_ITEMS = [
    {
        id: 1,
        src: '/image1.png',
        alt: 'Gallery image 1',
        aspectRatio: '16:9',
        loading: 'eager', // First image should load immediately
        // Optional properties for future enhancements:
        // caption: 'Image caption',
        // link: '/product-page',
        // tags: ['featured', 'new'],
    },
    {
        id: 2,
        src: '/image2.png',
        alt: 'Gallery image 2',
        aspectRatio: '9:16',
        loading: 'lazy',
        customHeight: '343px', // Override default height
    },
    {
        id: 3,
        src: '/image3.png',
        alt: 'Gallery image 3',
        aspectRatio: '9:16',
        loading: 'lazy',
        customGap: -56, // Reduced gap from previous item
    },
    {
        id: 4,
        src: '/image4.png',
        alt: 'Gallery image 4',
        aspectRatio: '16:9',
        loading: 'lazy',
    },
    {
        id: 5,
        src: '/image5.png',
        alt: 'Gallery image 5',
        aspectRatio: '9:16',
        loading: 'lazy',
    },
]

/**
 * Gallery Renderer
 * Dynamically creates gallery items from data
 */
function createGalleryRenderer(config = {}) {
    const {
        containerSelector = '#galleryScroll',
        itemClass = 'gallery-item',
        aspectRatioClasses = {
            '16:9': 'item-16-9',
            '9:16': 'item-9-16',
            '1:1': 'item-1-1',
            '4:3': 'item-4-3',
        },
    } = config
    
    /**
     * Create a single gallery item element
     */
    function createGalleryItem(item, index) {
        const div = document.createElement('div')
        div.className = `${itemClass} ${aspectRatioClasses[item.aspectRatio] || ''}`
        div.dataset.index = index + 1
        
        if (item.customHeight) {
            div.style.height = item.customHeight
        }
        
        if (item.customGap) {
            div.style.marginLeft = `${item.customGap}px`
        }
        
        const img = document.createElement('img')
        img.src = item.src
        img.alt = item.alt
        img.loading = item.loading || 'lazy'
        
        // Add optional link wrapper
        if (item.link) {
            const link = document.createElement('a')
            link.href = item.link
            link.appendChild(img)
            div.appendChild(link)
        } else {
            div.appendChild(img)
        }
        
        return div
    }
    
    /**
     * Render all gallery items into the container
     */
    function render(items = GALLERY_ITEMS) {
        const container = document.querySelector(containerSelector)
        
        if (!container) {
            console.warn(`Gallery container "${containerSelector}" not found`)
            return
        }
        
        // Clear existing items (except spacer)
        const existingItems = container.querySelectorAll(`.${itemClass}`)
        existingItems.forEach(item => item.remove())
        
        // Create fragment for better performance
        const fragment = document.createDocumentFragment()
        
        items.forEach((item, index) => {
            fragment.appendChild(createGalleryItem(item, index))
        })
        
        // Insert before spacer if it exists
        const spacer = container.querySelector('.gallery-spacer')
        if (spacer) {
            container.insertBefore(fragment, spacer)
        } else {
            container.appendChild(fragment)
        }
        
        console.log(`Gallery rendered with ${items.length} items`)
    }
    
    /**
     * Add a single item to the gallery
     */
    function addItem(item) {
        const container = document.querySelector(containerSelector)
        if (!container) return
        
        const index = container.querySelectorAll(`.${itemClass}`).length
        const element = createGalleryItem(item, index)
        
        const spacer = container.querySelector('.gallery-spacer')
        if (spacer) {
            container.insertBefore(element, spacer)
        } else {
            container.appendChild(element)
        }
    }
    
    /**
     * Remove an item by index
     */
    function removeItem(index) {
        const container = document.querySelector(containerSelector)
        if (!container) return
        
        const item = container.querySelector(`[data-index="${index}"]`)
        if (item) {
            item.remove()
        }
    }
    
    return {
        render,
        addItem,
        removeItem,
        items: GALLERY_ITEMS,
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GALLERY_ITEMS, createGalleryRenderer }
}

// Make available globally
window.GalleryData = { GALLERY_ITEMS, createGalleryRenderer }

