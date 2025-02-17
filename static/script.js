document.addEventListener('DOMContentLoaded', function () { 
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
        // Use a small delay to ensure the container has resized
        setTimeout(function () {
            map.invalidateSize();
            if (geoJsonBounds) {
                map.fitBounds(geoJsonBounds); // Reset the zoom to fit the bounds
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

    // Function to update the popup content
    function updatePopupContent(content) {
        document.getElementById('info-box').innerHTML = content;
    }

    // Get the GeoJSON path from the script tag's data attribute
    const scriptElement = document.querySelector('script[data-geojson-path]');
    const geojsonPath = scriptElement.getAttribute('data-geojson-path');

    // Load and display the GeoJSON data for Italy's regions
    fetch(geojsonPath)
        .then(response => response.json())
        .then(data => {

            // Assign colors to regions using D3 color scale
            const regionColors = {};
            data.features.forEach((feature, index) => {
                regionColors[feature.properties.reg_name] = colorScale(index);
            });

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
                        // Revert the color of the previously selected region
                        if (window.selectedLayer) {
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
                        console.log("Selected Region:", regionName); // Debugging log
                    
                        // Fetch region info from Flask backend
                        fetch('/get_region_info', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ region: regionName }),
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log("Flask Response:", data); // Debugging log
                    
                            // Clone the region template
                            const template = document.getElementById('region-template').cloneNode(true);
                            template.style.display = 'block'; // Make the cloned template visible

                            // Update the placeholders with actual data
                            template.querySelector('#region-name-placeholder').textContent = regionName;
                            template.querySelector('#region-info-placeholder').textContent = data.info;

                            // Update the info-box with the populated template
                            updatePopupContent(template.innerHTML);
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            updatePopupContent("Failed to load region information."); // Fallback
                        });
                    
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

            // Fit the map to the bounds of the feature group
            map.fitBounds(geoJsonBounds);

        })
        .catch(error => console.error('Error loading GeoJSON data:', error));

    // Function to revert the selection and update the popup
    function revertSelection() {
        if (window.selectedLayer) {
            window.selectedLayer.setStyle({
                fillColor: window.selectedLayer.originalColor
            });
            window.selectedLayer.selected = false; // Mark the region as unselected
            window.selectedLayer = null; // Clear the selected region
        }

        // Revert to general information about Italy
        const generalInfo = document.getElementById('general-info').innerHTML;
        updatePopupContent(generalInfo);
    }

    // Check if the click is outside the map container
    document.addEventListener('click', function (event) {
        const mapContainer = document.getElementById('map-container'); // Replace with your map container's ID
        const customPopup = document.getElementById('info-box'); // Replace with your custom popup's ID
        const image = document.getElementById('map-logo'); // Replace with your image's ID

        // Check if the click is outside the map container or on the image
        if (
            (!mapContainer.contains(event.target) && !customPopup.contains(event.target)) ||
            image.contains(event.target)
        ) {
            revertSelection();
        }
    });

    // Revert to general information when clicking outside the map
    map.on('click', function (e) {
        // Check if the click is on a GeoJSON feature
        const isClickOnFeature = geojson_feat.getLayers().some(layer => {
            return layer.getBounds().contains(e.latlng);
        });

        // Only revert the selection if the click is NOT on a GeoJSON feature
        if (!isClickOnFeature) {
            revertSelection();
        }
    });

    // Initialize the popup with general information
    window.onload = function () {
        const generalInfo = document.getElementById('general-info').innerHTML;
        updatePopupContent(generalInfo);
    };
});