import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix for default marker icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapView = ({ places }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([40.7128, -74.0060], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for places with coordinates
    if (places && places.length > 0) {
      const validPlaces = places.filter(p => p.latitude && p.longitude);
      
      if (validPlaces.length > 0) {
        const bounds = L.latLngBounds(validPlaces.map(p => [p.latitude, p.longitude]));
        
        validPlaces.forEach(place => {
          const marker = L.marker([place.latitude, place.longitude])
            .addTo(map)
            .bindPopup(`<b>${place.name}</b><br/>${place.address || place.formatted_address || ''}`);
          markersRef.current.push(marker);
        });

        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    return () => {
      // Cleanup is handled by markersRef
    };
  }, [places]);

  return <div ref={mapRef} style={styles.map} />;
};

const styles = {
  map: {
    height: '400px',
    width: '100%',
    maxWidth: '100%',
    borderRadius: '8px',
    marginBottom: '2rem',
    zIndex: 0,
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
};

export default MapView;

