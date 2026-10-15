import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, MapPin } from "lucide-react";
import Button from "../ui/Button";
const createAmberPinIcon = () => L.divIcon({
  className: "custom-leaflet-marker",
  html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
        <span style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(245, 158, 11, 0.35); animation: pulseDot 2s infinite;"></span>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #F59E0B, #EF4444); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(245, 158, 11, 0.8); border: 2px solid #ffffff;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A0F1E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});
function MapEventsHandler({
  onMapClick
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}
function MapCenterController({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}
export const LocationPicker = ({
  initialLat = 37.7749,
  initialLng = -122.4194,
  onLocationSelect,
  className = "h-80"
}) => {
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [addressPreview, setAddressPreview] = useState("Market St & 4th St, San Francisco, CA");
  const [isLocating, setIsLocating] = useState(false);
  const markerIcon = useMemo(() => createAmberPinIcon(), []);
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "RoadMate-Frontend/1.0" } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          const formatted = data.display_name.split(",").slice(0, 3).join(",");
          setAddressPreview(formatted);
          onLocationSelect(lat, lng, formatted);
          return;
        }
      }
    } catch {
    }
    const fallbackAddr = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    setAddressPreview(fallbackAddr);
    onLocationSelect(lat, lng, fallbackAddr);
  };
  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    const latlng = marker.getLatLng();
    setPosition([latlng.lat, latlng.lng]);
    reverseGeocode(latlng.lat, latlng.lng);
  };
  const handleMapClick = (lat, lng) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 7e3 }
    );
  };
  return <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"><div className={`w-full ${className}`}><MapContainer
    center={position}
    zoom={14}
    scrollWheelZoom={true}
    style={{ width: "100%", height: "100%" }}
  ><TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  /><Marker
    position={position}
    draggable={true}
    icon={markerIcon}
    eventHandlers={{ dragend: handleMarkerDragEnd }}
  /><MapEventsHandler onMapClick={handleMapClick} /><MapCenterController lat={position[0]} lng={position[1]} /></MapContainer></div>{
    /* Floating GPS and address pill */
  }<div className="absolute top-3 right-3 z-[1000]"><Button
    type="button"
    variant="outline"
    size="sm"
    onClick={handleUseCurrentLocation}
    isLoading={isLocating}
    className="bg-navy-950/90 text-amber-400 hover:text-amber-300 border-amber-500/40 backdrop-blur-md shadow-lg"
    leftIcon={<Crosshair className="w-4 h-4" />}
  >
          My Location
        </Button></div><div className="absolute bottom-3 left-3 right-3 z-[1000] glass px-3.5 py-2.5 rounded-xl border border-white/15 bg-navy-950/90 backdrop-blur-md flex items-center justify-between text-xs"><div className="flex items-center gap-2 text-slate-200 truncate pr-2"><MapPin className="w-4 h-4 text-amber-400 shrink-0" /><span className="truncate font-medium">{addressPreview}</span></div><span className="text-[10px] text-slate-400 shrink-0 uppercase tracking-wide">
          Drag pin to adjust
        </span></div></div>;
};
export default LocationPicker;
