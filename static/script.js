document.addEventListener('DOMContentLoaded', function () { 
    console.log('DOM Content Loaded - Initializing map...');
    // Initialize the map
    var map = L.map('map', {
        dragging: false, // Disable map dragging
        zoomControl: false, // Disable zoom controls
        scrollWheelZoom: false, // Disable zooming with the mouse wheel
        doubleClickZoom: false, // Disable zooming with double-click
        touchZoom: false, // Disable zooming with touch gestures
        boxZoom: false, // Disable zooming with a box selection
        keyboard: false // Disable zooming with keyboard shortcuts
    }).setView([41.9028, 12.4964], 6); // Centered on Italy

    // Variable to store the bounds of the GeoJSON features
    var geoJsonBounds;

    // Ensure the map resizes when the window is resized
    window.addEventListener('resize', function () {
        console.log('Window resize event detected');
        // Use a small delay to ensure the container has resized
        setTimeout(function () {
            map.invalidateSize();
            if (geoJsonBounds) {
                map.fitBounds(geoJsonBounds); // Reset the zoom to fit the bounds
                console.log('Map resized and bounds reset');
            }
        }, 100); // Adjust the delay if needed
    });
       
    // Define a color scale using D3
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Function to darken a color using D3
    function darkenColor(color, percent) {
        const d3Color = d3.color(color);
        if (!d3Color) return color;
        const factor = percent / 100;
        return d3Color.darker(factor).toString();
    }

    // Function to update the info-box content
    function updatePopupContent(content) {
        console.log('Updating info-box content');
        document.getElementById('info-box').innerHTML = content;
    }

    // Get the GeoJSON path from the script tag's data attribute
    const scriptElement = document.querySelector('script[data-geojson-path]');
    const geojsonPath = scriptElement.getAttribute('data-geojson-path');
    console.log('GeoJSON path:', geojsonPath);

    // Load and display the GeoJSON data for Italy's regions
    console.log('Fetching GeoJSON data...');
    fetch(geojsonPath)
        .then(response => response.json())
        .then(data => {
            console.log('GeoJSON data loaded successfully:', data.features.length, 'regions');

            // Assign colors to regions using D3 color scale
            const regionColors = {};
            data.features.forEach((feature, index) => {
                regionColors[feature.properties.reg_name] = colorScale(index);
            });
            console.log('Region colors assigned');

            // Add Italy's regions to the map
            geojson_feat = L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: 'black', // Border color
                        weight: 0.5,
                        opacity: 1,
                        fillColor: regionColors[feature.properties.reg_name], // D3 assigned color
                        fillOpacity: 0.7
                    };
                },
                
                onEachFeature: function (feature, layer) {
                    // Store the original color
                    layer.originalColor = layer.options.fillColor;

                    // Add a `selected` property to track if the region is clicked
                    layer.selected = false;

                    // Change color on mouseover
                    layer.on('mouseover', function (e) {
                        console.log('Mouseover region:', feature.properties.reg_name);
                        if (!layer.selected) { // Only darken if the region is not selected
                            layer.setStyle({
                                fillColor: darkenColor(layer.originalColor, 100) // Darken the color by 20%
                            });
                        }
                    });

                    // Revert color on mouseout if the region is not selected
                    layer.on('mouseout', function (e) {
                        if (!layer.selected) { // Only revert if the region is not selected
                            layer.setStyle({
                                fillColor: layer.originalColor
                            });
                        }
                    });

                    // Highlight the selected region on click
                    layer.on('click', function (e) {
                        console.log('Click event detected on region:', feature.properties.reg_name);
                        
                        // Revert the color of the previously selected region
                        if (window.selectedLayer) {
                            console.log('Reverting previously selected region');
                            window.selectedLayer.setStyle({
                                fillColor: window.selectedLayer.originalColor
                            });
                            window.selectedLayer.selected = false;
                        }
                    
                        // Darken the color of the selected region
                        layer.setStyle({
                            fillColor: darkenColor(layer.originalColor, 100)
                        });
                        layer.selected = true;
                    
                        // Get the selected region name
                        const regionName = feature.properties.reg_name;
                        console.log("Selected Region:", regionName);
                    
                        // Show loading state
                        updatePopupContent(`
                            <div class="loading-info">
                                <h2>${regionName}</h2>
                                <p>Loading region information...</p>
                            </div>
                        `);

                        // Fetch region info from Flask backend
                        console.log('Fetching region info from backend for:', regionName);
                        fetch('/get_region_info', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ region: regionName }),
                        })
                        .then(response => {
                            console.log('Backend response status:', response.status);
                            // Store request ID from headers if available
                            const requestId = response.headers.get('X-Request-ID');
                            if (requestId) {
                                console.log('Request ID:', requestId);
                            }
                            
                            // Check if response is ok before parsing JSON
                            if (!response.ok) {
                                return response.json().then(errorData => {
                                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                                });
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log("Flask Response:", data);
                            
                            if (data.error) {
                                throw new Error(data.error);
                            }
                    
                            // Clone the region template
                            const template = document.getElementById('region-template');
                            if (!template) {
                                console.error('Region template element not found');
                                throw new Error('Template not found');
                            }
                            const clonedTemplate = template.cloneNode(true);
                            clonedTemplate.style.display = 'block';

                            // Update the placeholders with actual data
                            const nameElement = clonedTemplate.querySelector('#region-name-placeholder');
                            const infoElement = clonedTemplate.querySelector('#region-info-placeholder');
                            
                            if (!nameElement || !infoElement) {
                                console.error('Template placeholders not found:', {
                                    nameFound: !!nameElement,
                                    infoFound: !!infoElement
                                });
                                throw new Error('Template placeholders not found');
                            }

                            nameElement.textContent = regionName;
                            infoElement.textContent = data.info;

                            // Update the info-box with the populated template
                            updatePopupContent(clonedTemplate.innerHTML);
                        })
                        .catch(error => {
                            console.error('Error fetching region info:', error);
                            console.error('Error details:', {
                                message: error.message,
                                stack: error.stack
                            });
                            
                            // Determine if the error is retryable
                            const isRetryable = error.message.includes('timeout') || 
                                              error.message.includes('connect') ||
                                              error.message.includes('try again');
                            
                            // Create retry button if applicable
                            const retryButton = isRetryable ? `
                                <button onclick="retryRegionFetch('${regionName}')" class="retry-button">
                                    Try Again
                                </button>
                            ` : '';
                            
                            // Display a more informative error message
                            updatePopupContent(`
                                <div class="error-info">
                                    <h2>${regionName}</h2>
                                    <p class="error-message">
                                        ${error.message || "Failed to load region information."}
                                    </p>
                                    ${retryButton}
                                </div>
                            `);
                        });

                        // Add the retry function to the window object
                        window.retryRegionFetch = function(regionName) {
                            console.log('Retrying fetch for region:', regionName);
                            // Show loading state
                            updatePopupContent(`
                                <div class="loading-info">
                                    <h2>${regionName}</h2>
                                    <p>Retrying to load region information...</p>
                                </div>
                            `);
                            
                            // Retry the fetch
                            fetch('/get_region_info', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ region: regionName }),
                            })
                            .then(response => {
                                console.log('Backend response status:', response.status);
                                const requestId = response.headers.get('X-Request-ID');
                                if (requestId) {
                                    console.log('Request ID:', requestId);
                                }
                                
                                if (!response.ok) {
                                    return response.json().then(errorData => {
                                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                                    });
                                }
                                return response.json();
                            })
                            .then(data => {
                                if (data.error) {
                                    throw new Error(data.error);
                                }
                                
                                const template = document.getElementById('region-template');
                                if (!template) {
                                    throw new Error('Template not found');
                                }
                                const clonedTemplate = template.cloneNode(true);
                                clonedTemplate.style.display = 'block';
                                
                                const nameElement = clonedTemplate.querySelector('#region-name-placeholder');
                                const infoElement = clonedTemplate.querySelector('#region-info-placeholder');
                                
                                if (!nameElement || !infoElement) {
                                    throw new Error('Template placeholders not found');
                                }
                                
                                nameElement.textContent = regionName;
                                infoElement.textContent = data.info;
                                
                                updatePopupContent(clonedTemplate.innerHTML);
                            })
                            .catch(error => {
                                console.error('Error in retry attempt:', error);
                                updatePopupContent(`
                                    <div class="error-info">
                                        <h2>${regionName}</h2>
                                        <p class="error-message">
                                            ${error.message || "Failed to load region information."}
                                        </p>
                                        <p>Please try again later.</p>
                                    </div>
                                `);
                            });
                        };
                    
                        window.selectedLayer = layer;
                    });
                }
            }).addTo(map);

            // Create a feature group and add the GeoJSON layer to it
            var featureGroup = L.featureGroup([geojson_feat]);
            
            // Get the bounds of the feature group
            var bounds = featureGroup.getBounds();
            
            // Convert bounds to an array of arrays
            geoJsonBounds = [
                [bounds.getSouthWest().lat, bounds.getSouthWest().lng], // Southwest corner
                [bounds.getNorthEast().lat, bounds.getNorthEast().lng]  // Northeast corner
            ];
            console.log('Map bounds calculated:', geoJsonBounds);

            // Fit the map to the bounds of the feature group
            map.fitBounds(geoJsonBounds);
            console.log('Map fitted to bounds');

        })
        .catch(error => {
            console.error('Error loading GeoJSON data:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
        });

    // Function to revert the selection and update the popup
    function revertSelection() {
        console.log('Reverting selection');
        if (window.selectedLayer) {
            window.selectedLayer.setStyle({
                fillColor: window.selectedLayer.originalColor
            });
            window.selectedLayer.selected = false; // Mark the region as unselected
            window.selectedLayer = null; // Clear the selected region
            console.log('Selection cleared');
        }

        // Revert to general information about Italy
        const generalInfo = document.getElementById('general-info').innerHTML;
        updatePopupContent(generalInfo);
    }

    // Check if the click is outside the map container
    document.addEventListener('click', function (event) {
        const mapContainer = document.getElementById('map-container');
        const customPopup = document.getElementById('info-box');
        const image = document.getElementById('map-logo');

        // Check if the click is outside the map container or on the image
        if (
            (!mapContainer.contains(event.target) && !customPopup.contains(event.target)) ||
            image.contains(event.target)
        ) {
            console.log('Click detected outside map container');
            revertSelection();
        }
    });

    // Revert to general information when clicking outside the map
    map.on('click', function (e) {
        console.log('Map click event at coordinates:', e.latlng);
        // Check if the click is on a GeoJSON feature
        const isClickOnFeature = geojson_feat.getLayers().some(layer => {
            return layer.getBounds().contains(e.latlng);
        });

        // Only revert the selection if the click is NOT on a GeoJSON feature
        if (!isClickOnFeature) {
            console.log('Click was not on a region - reverting selection');
            revertSelection();
        }
    });

    // Initialize the popup with general information
    window.onload = function () {
        console.log('Window loaded - initializing popup');
        const generalInfo = document.getElementById('general-info').innerHTML;
        updatePopupContent(generalInfo);
    };
});
