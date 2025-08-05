// Color palette generation and management
class ColorPaletteManager {
    constructor() {
        this.copyFormat = 'hex'; // Default format
        this.staticPalettes = []; // Will be loaded from JSON
        this.favorites = new Set(); // Store favorite palette names
        this.showFavoritesOnly = false; // Filter state
        this.selectedTag = '';
        this.init();
    }

    async init() {
        await this.loadPalettes();
        this.loadFavorites();
        this.bindEvents();
        this.displayStaticPalettes();
    }

    async loadPalettes() {
        try {
            const response = await fetch('palettes.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.staticPalettes = data.palettes;
        } catch (error) {
            console.error('Failed to load palettes:', error);
            // Fallback to default palettes if JSON loading fails
            this.staticPalettes = [
                {
                    name: "Ocean Breeze",
                    colors: [
                        { hex: "#2E86AB", rgb: "rgb(46, 134, 171)", rgb_plain: "(46, 134, 171)", hsl: "hsl(200, 58%, 43%)" },
                        { hex: "#A23B72", rgb: "rgb(162, 59, 114)", rgb_plain: "(162, 59, 114)", hsl: "hsl(330, 47%, 43%)" },
                        { hex: "#F18F01", rgb: "rgb(241, 143, 1)", rgb_plain: "(241, 143, 1)", hsl: "hsl(35, 99%, 47%)" },
                        { hex: "#C73E1D", rgb: "rgb(199, 62, 29)", rgb_plain: "(199, 62, 29)", hsl: "hsl(12, 74%, 45%)" },
                        { hex: "#3B1F2B", rgb: "rgb(59, 31, 43)", rgb_plain: "(59, 31, 43)", hsl: "hsl(330, 31%, 18%)" }
                    ]
                }
            ];
        }
    }

    // Load favorites from localStorage
    loadFavorites() {
        try {
            const savedFavorites = localStorage.getItem('colorPaletteFavorites');
            if (savedFavorites) {
                this.favorites = new Set(JSON.parse(savedFavorites));
            }
        } catch (error) {
            console.error('Failed to load favorites:', error);
        }
    }

    // Save favorites to localStorage
    saveFavorites() {
        try {
            localStorage.setItem('colorPaletteFavorites', JSON.stringify([...this.favorites]));
        } catch (error) {
            console.error('Failed to save favorites:', error);
        }
    }

    bindEvents() {
        // Format dropdown change handler
        document.getElementById('copyFormat').addEventListener('change', (e) => {
            this.copyFormat = e.target.value;
        });

        // Favorites toggle button
        document.getElementById('favoritesToggle').addEventListener('click', () => {
            this.toggleFavoritesFilter();
        });

        // Go to top button
        document.getElementById('goToTop').addEventListener('click', () => {
            this.scrollToTop();
        });

        // Tag filter dropdown change handler
        document.getElementById('tagFilter').addEventListener('change', (e) => {
            this.selectedTag = e.target.value;
            this.displayStaticPalettes();
        });


        // Use event delegation for copy buttons, color swatches, favorite buttons, and modal triggers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                const colorSwatch = e.target.closest('.color-swatch');
                if (colorSwatch) {
                    const colorHex = colorSwatch.dataset.color;
                    this.copyToClipboard(colorHex);
                }
            } else if (e.target.classList.contains('color-swatch')) {
                // Click on the color swatch itself
                const colorHex = e.target.dataset.color;
                this.copyToClipboard(colorHex);
            } else if (e.target.classList.contains('favorite-btn')) {
                // Toggle favorite status
                e.stopPropagation();
                this.toggleFavorite(e.target);
            }
        });

        // Add hover events for color swatches to show values in card title
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('color-swatch')) {
                this.showColorValues(e.target);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('color-swatch')) {
                this.hideColorValues(e.target);
            }
        });

        // Scroll event for go to top button visibility
        window.addEventListener('scroll', () => {
            this.toggleGoToTopButton();
        });
    }

    // Show color values in the card title area
    showColorValues(colorSwatch) {
        const paletteCard = colorSwatch.closest('.palette-card');
        const colorInfo = paletteCard.querySelector('.color-info');
        const colorHex = colorSwatch.dataset.color;
        const colorRgb = colorSwatch.dataset.rgb;
        const favoriteBtn = colorInfo.querySelector('.favorite-btn');
        
        colorInfo.innerHTML = `
            <div class="palette-name">${paletteCard.querySelector('.palette-name').textContent}</div>
            <div class="color-values">
                <span class="color-hex">${colorHex}</span>
                <span class="color-rgb">${colorRgb}</span>
            </div>
        `;
        
        // Re-add the favorite button if it existed
        if (favoriteBtn) {
            colorInfo.appendChild(favoriteBtn);
        }
    }

    // Hide color values and restore original title
    hideColorValues(colorSwatch) {
        const paletteCard = colorSwatch.closest('.palette-card');
        const colorInfo = paletteCard.querySelector('.color-info');
        const paletteName = paletteCard.querySelector('.palette-name').textContent;
        const favoriteBtn = colorInfo.querySelector('.favorite-btn');
        
        colorInfo.innerHTML = `
            <div class="palette-name">${paletteName}</div>
        `;
        
        // Re-add the favorite button if it existed
        if (favoriteBtn) {
            colorInfo.appendChild(favoriteBtn);
        }
    }

    // Display static palettes
    displayStaticPalettes() {
        const paletteGrid = document.getElementById('paletteGrid');
        paletteGrid.innerHTML = '';

        let filteredPalettes = this.staticPalettes;

        // Filter by favorites if enabled
        if (this.showFavoritesOnly) {
            filteredPalettes = filteredPalettes.filter(palette => this.favorites.has(palette.name));
        }

        // Filter by tag if selected
        if (this.selectedTag) {
            filteredPalettes = filteredPalettes.filter(palette => 
                palette.tags && palette.tags.includes(this.selectedTag)
            );
        }

        filteredPalettes.forEach(palette => {
            const paletteCard = this.renderPalette(palette);
            paletteGrid.appendChild(paletteCard);
        });
    }

    // Render a single palette
    renderPalette(palette) {
        const paletteCard = document.createElement('div');
        paletteCard.className = 'palette-card';
        paletteCard.setAttribute('data-palette-name', palette.name);

        const paletteColors = document.createElement('div');
        paletteColors.className = 'palette-colors';

        palette.colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color.hex;
            swatch.setAttribute('data-color', color.hex);
            swatch.setAttribute('data-rgb', color.rgb);
            swatch.setAttribute('data-rgb-plain', color.rgb_plain || this.extractRgbPlain(color.rgb));
            swatch.setAttribute('data-hsl', color.hsl);
            paletteColors.appendChild(swatch);
        });

        const colorInfo = document.createElement('div');
        colorInfo.className = 'color-info';

        const paletteName = document.createElement('div');
        paletteName.className = 'palette-name';
        paletteName.textContent = palette.name;

        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-btn';
        favoriteBtn.innerHTML = this.favorites.has(palette.name) ? '★' : '☆';
        favoriteBtn.setAttribute('data-palette-name', palette.name);
        
        // Add favorited class if palette is in favorites
        if (this.favorites.has(palette.name)) {
            favoriteBtn.classList.add('favorited');
        }

        colorInfo.appendChild(paletteName);
        colorInfo.appendChild(favoriteBtn);

        paletteCard.appendChild(paletteColors);
        paletteCard.appendChild(colorInfo);

        return paletteCard;
    }

    // Copy color to clipboard
    copyToClipboard(colorHex) {
        const colorSwatch = document.querySelector(`[data-color="${colorHex}"]`);
        if (!colorSwatch) return;

        let colorValue;
        switch (this.copyFormat) {
            case 'hex':
                colorValue = colorHex;
                break;
            case 'rgb':
                colorValue = colorSwatch.dataset.rgb;
                break;
            case 'rgb_plain':
                colorValue = colorSwatch.dataset.rgbPlain;
                break;
            case 'hsl':
                colorValue = colorSwatch.dataset.hsl;
                break;
            default:
                colorValue = colorHex;
        }

        navigator.clipboard.writeText(colorValue).then(() => {
            this.showToast(`${this.copyFormat.toUpperCase()} color copied: ${colorValue}`);
        }).catch(err => {
            console.error('Failed to copy color:', err);
            this.showToast('Failed to copy color');
        });
    }

    // Toggle favorite status for a palette
    toggleFavorite(favoriteBtn) {
        const paletteCard = favoriteBtn.closest('.palette-card');
        const paletteName = paletteCard.dataset.paletteName;
        
        if (this.favorites.has(paletteName)) {
            this.favorites.delete(paletteName);
            favoriteBtn.innerHTML = '☆'; // Change to empty star
            favoriteBtn.classList.remove('favorited'); // Remove favorited class
            this.showToast(`Removed "${paletteName}" from favorites`);
        } else {
            this.favorites.add(paletteName);
            favoriteBtn.innerHTML = '★'; // Change to filled star
            favoriteBtn.classList.add('favorited'); // Add favorited class
            this.showToast(`Added "${paletteName}" to favorites`);
        }
        
        this.saveFavorites();
        
        // If we're showing favorites only and this palette was removed, refresh the display
        if (this.showFavoritesOnly && !this.favorites.has(paletteName)) {
            this.displayStaticPalettes();
        }
    }

    // Toggle favorites filter
    toggleFavoritesFilter() {
        this.showFavoritesOnly = !this.showFavoritesOnly;
        const toggleBtn = document.getElementById('favoritesToggle');
        
        if (this.showFavoritesOnly) {
            toggleBtn.classList.add('active');
            toggleBtn.querySelector('.favorites-text').textContent = 'Show All Palettes';
        } else {
            toggleBtn.classList.remove('active');
            toggleBtn.querySelector('.favorites-text').textContent = 'Show Favorites Only';
        }
        
        this.displayStaticPalettes();
    }

    // Show toast notification
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Toggle go to top button visibility
    toggleGoToTopButton() {
        const goToTopBtn = document.getElementById('goToTop');
        if (window.pageYOffset > 300) {
            goToTopBtn.classList.add('visible');
        } else {
            goToTopBtn.classList.remove('visible');
        }
    }

    // Extract plain RGB values from rgb(r, g, b) format
    extractRgbPlain(rgbString) {
        const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            return `(${match[1]}, ${match[2]}, ${match[3]})`;
        }
        return rgbString; // Fallback to original if parsing fails
    }

    // Scroll to top with smooth animation
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }


}

// Initialize the color palette manager when the page loads
let colorManager;
document.addEventListener('DOMContentLoaded', () => {
    colorManager = new ColorPaletteManager();
}); 