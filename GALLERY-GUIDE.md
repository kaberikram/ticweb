# Gallery Guide - Adding Photos

## 🎯 Best Way to Add Photos

The gallery now **automatically detects image orientation**! You don't need to specify whether an image is landscape or portrait.

## 📝 How to Add a New Photo

### Method 1: HTML (Recommended)

1. Open `index.html`
2. Find the gallery section (look for `id="galleryScroll"`)
3. Copy this template:

```html
<div class="gallery-item" data-auto-orient>
    <img src="/your-image.png" alt="Description" loading="lazy" />
</div>
```

4. Paste it before the `</div>` that closes `gallery-scroll`
5. Update:
   - `src` - Your image path (e.g., `/image6.png`)
   - `alt` - Description for accessibility
   - `loading` - Use `"eager"` for first image, `"lazy"` for others

**That's it!** The system will automatically:
- ✅ Detect if it's landscape or portrait
- ✅ Apply the correct sizing
- ✅ Add it to the gallery

### Method 2: JavaScript (Dynamic)

If you want to add images programmatically:

```javascript
// Add a new image
window.GalleryAuto.addItem('/image6.png', 'Gallery image 6')
```

## 🔍 How Orientation Detection Works

The system analyzes each image's **natural dimensions** (width/height ratio):

- **Landscape** (wider than tall): Ratio > 1.2
  - Gets class: `item-16-9`
  - Size: 609px × 343px
  
- **Portrait** (taller than wide): Ratio < 0.8
  - Gets class: `item-9-16`
  - Size: 297.58px × 529px
  
- **Square** (roughly equal): Ratio between 0.8-1.2
  - Gets class: `item-1-1`
  - Size: 400px × 400px

## 📋 Example: Adding Multiple Images

```html
<!-- Image 6 - Landscape -->
<div class="gallery-item" data-auto-orient>
    <img src="/image6.png" alt="New product shot" loading="lazy" />
</div>

<!-- Image 7 - Portrait -->
<div class="gallery-item" data-auto-orient>
    <img src="/image7.png" alt="Model wearing shirt" loading="lazy" />
</div>

<!-- Image 8 - Square -->
<div class="gallery-item" data-auto-orient>
    <img src="/image8.png" alt="Logo close-up" loading="lazy" />
</div>
```

## 🎨 Custom Overrides

If you need to override the auto-detection:

```html
<!-- Force landscape even if image is portrait -->
<div class="gallery-item item-16-9" data-auto-orient>
    <img src="/image.png" alt="Description" />
</div>
```

## 🐛 Troubleshooting

**Image not showing correct size?**
- Check browser console for detection messages
- Make sure image has loaded (check Network tab)
- Verify image path is correct

**Want to see what was detected?**
- Open browser console (F12)
- Look for: `"Image '...' detected as landscape/portrait/square"`

## 💡 Tips

1. **First image**: Use `loading="eager"` for faster initial load
2. **Other images**: Use `loading="lazy"` for better performance
3. **Alt text**: Always add descriptive alt text for accessibility
4. **File names**: Use descriptive names like `product-shot-1.png`

## 📊 Current Gallery Structure

The gallery automatically:
- Maintains consistent spacing (106px gap)
- Scales on mobile (50% size)
- Applies zoom effects based on scroll position
- Handles any number of images

---

**Need help?** Check the browser console for auto-detection logs!

