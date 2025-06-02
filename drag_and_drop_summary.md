# Drag-and-Drop T-Shirt Functionality Summary

The drag-and-drop T-shirt mechanism in `ratalog.html` (with logic primarily in `script.js`) allows users to visually try different T-shirts on a central model (a rat or mouse).

## Key Functions and Phases:

1.  **Initiation (on `mousedown`/`touchstart` via `handleStart`):**
    *   When a user presses down on a T-shirt image, it becomes the `activeShirt`.
    *   The system records the shirt's initial position and the model's current image source (`originalRatSrc`).
    *   The shirt's cursor changes to `grabbing`, its `zIndex` is increased to bring it to the front, and a `grabbed` CSS class is applied for initial visual feedback (e.g., a slight lift).

2.  **Dragging (on `mousemove`/`touchmove` via `handleMove`):**
    *   The `activeShirt`'s `left` and `top` CSS properties are continuously updated to follow the cursor or finger.
    *   **Skewing/Distortion Effect:**
        *   As the shirt is dragged horizontally, CSS classes (`dragging-left` or `dragging-right`) are applied to it, which trigger transform rules in CSS to create a visual skew effect, making the drag feel more dynamic.
        *   If the shirt stops moving for a brief period (50ms), these skewing classes are removed, and the `grabbed` class is reapplied, returning it to a non-skewed "held" appearance.
    *   **Model State Change (Hover Effect):**
        *   The system constantly checks for collision between the dragged shirt and the model (`ratImage`).
        *   If the shirt hovers over the model:
            *   The model's image (`ratImage.src`) changes to a "hover" version (e.g., `../1RatHover.png` or `../1RatHoverM.png` depending on whether "Rat" or "Mouse" mode is active). The correct hover image is determined using `validHoverPaths` and the `currentMode`.
            *   This gives immediate feedback that the model is ready to receive the shirt.
        *   If the shirt is dragged off the model, the model's image reverts to `originalRatSrc`.

3.  **Dropping (on `mouseup`/`touchend`/`touchcancel` via `handleEnd`):**
    *   Mouse/touch event listeners for movement are removed.
    *   Styling classes (`dragging-left`, `dragging-right`, `grabbed`) are removed from the shirt, and its `zIndex` is reset.
    *   **Collision Check:** The system checks if the *center* of the dropped shirt is within the model's boundaries.
        *   **If Dropped on Model:**
            *   The model's image (`ratImage.src`) is updated to wear the new T-shirt. The specific image path is taken from the `activeShirt`'s `data-rat-src` attribute. The system also considers the `currentMode` (`rat` or `mouse`) and uses an `imageMap` to ensure the correct version of the shirted model is displayed (e.g., `1RatM.png` for rat mode if the base is `1Rat.png`).
            *   The displayed T-shirt name (`#shirt-name` element) is updated based on the `activeShirt`'s `data-shirt-name`.
            *   The information tooltip (`#info-tooltip`) is updated with the correct model size details.
            *   The `activeShirt` (the draggable image) is then visually reset to its original position in the layout.
        *   **If Dropped Elsewhere:**
            *   The `activeShirt` is animated back to its initial position using CSS transitions.
            *   If the model was in a hover state, its image reverts to `originalRatSrc`.
    *   The `activeShirt` variable is cleared.

4.  **Image Preloading:**
    *   To ensure smooth visual transitions and prevent loading flickers, all T-shirt images, model images (both rat and mouse versions), and their corresponding hover state images are preloaded when the page loads using a `preloadImages` function.

This combination of event handling, CSS class manipulation for visual effects (skewing), and dynamic image source changes based on interaction and mode creates an interactive "try-on" experience. 