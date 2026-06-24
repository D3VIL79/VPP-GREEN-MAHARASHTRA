import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix Leaflet's default icon path issues in React
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
};

interface MapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export default function Map({ markers, center = [19.0760, 72.8777], zoom = 13, className = "w-full h-full" }: MapProps) {
  // If we only have 1 marker, center on it dynamically
  const mapCenter = markers.length === 1 ? [markers[0].lat, markers[0].lng] : center;
  
  return (
    <div className={className}>
      <MapContainer 
        center={mapCenter as [number, number]} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', borderRadius: 'inherit', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={icon}>
            {(marker.title || marker.subtitle) && (
              <Popup>
                <div className="text-center">
                  {marker.title && <p className="font-bold mb-1">{marker.title}</p>}
                  {marker.subtitle && <p className="text-xs text-muted-foreground">{marker.subtitle}</p>}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
