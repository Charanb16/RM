import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Star, ShieldCheck, Phone } from "lucide-react";
const createCustomerIcon = () => L.divIcon({
  className: "customer-marker",
  html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        <span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: pulseDot 1.8s infinite;"></span>
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #EF4444; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(239, 68, 68, 0.9); border: 2px solid #ffffff;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="8"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
      </div>
    `,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});
const createProviderIcon = (isOnline = true) => L.divIcon({
  className: "provider-marker",
  html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
        <span style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: ${isOnline ? "rgba(59, 130, 246, 0.4)" : "rgba(100, 116, 139, 0.3)"}; animation: pulseDot 2.2s infinite;"></span>
        <div style="width: 32px; height: 32px; border-radius: 10px; background: ${isOnline ? "linear-gradient(135deg, #3B82F6, #1D4ED8)" : "#334155"}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(59, 130, 246, 0.8); border: 2px solid #ffffff;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3" width="15" height="13"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
      </div>
    `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});
export const ProviderMap = ({
  customerLat,
  customerLng,
  customerAddress = "Breakdown Site",
  providers = [],
  selectedProviderId,
  onSelectProvider,
  className = "h-96"
}) => {
  const customerIcon = useMemo(() => createCustomerIcon(), []);
  const providerOnlineIcon = useMemo(() => createProviderIcon(true), []);
  const providerOfflineIcon = useMemo(() => createProviderIcon(false), []);
  return <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"><div className={`w-full ${className}`}><MapContainer
    center={[customerLat, customerLng]}
    zoom={13}
    scrollWheelZoom={true}
    style={{ width: "100%", height: "100%" }}
  ><TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />{
    /* Customer marker */
  }<Marker position={[customerLat, customerLng]} icon={customerIcon}><Popup><div className="p-1 space-y-1"><div className="flex items-center gap-1.5 font-bold text-red-400 text-xs uppercase"><span>Your Breakdown Location</span></div><p className="text-xs text-slate-300 font-medium">{customerAddress}</p></div></Popup></Marker>{
    /* Provider markers */
  }{providers.map((p) => {
    const lat = p.current_lat ?? customerLat + (Math.random() - 0.5) * 0.04;
    const lng = p.current_lng ?? customerLng + (Math.random() - 0.5) * 0.04;
    return <Marker
      key={p.id}
      position={[lat, lng]}
      icon={p.is_online ? providerOnlineIcon : providerOfflineIcon}
      eventHandlers={{
        click: () => onSelectProvider?.(p)
      }}
    ><Popup><div className="p-1 min-w-[200px] space-y-2"><div className="flex items-center justify-between"><span className="font-bold text-sm text-white">{p.business_name}</span><div className="flex items-center gap-1 text-amber-400 text-xs font-semibold"><Star className="w-3.5 h-3.5 fill-current" /><span>{p.rating_avg.toFixed(1)}</span></div></div><p className="text-xs text-slate-300 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />{p.vehicle_type}</p><div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10"><span>{p.total_jobs} jobs done</span><span className="text-emerald-400 font-medium">Ready to dispatch</span></div>{p.user?.phone_number && <div className="pt-1 flex items-center gap-1 text-[11px] text-blue-400"><Phone className="w-3 h-3" /><span>{p.user.phone_number}</span></div>}</div></Popup></Marker>;
  })}</MapContainer></div>{
    /* Live Provider Count Pill */
  }<div className="absolute top-3 left-3 z-[1000] glass px-3.5 py-1.5 rounded-xl border border-white/15 bg-navy-950/90 backdrop-blur-md flex items-center gap-2 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /><span className="font-semibold text-slate-200">{providers.filter((p) => p.is_online).length} Certified Units Patrolling Nearby
        </span></div></div>;
};
export default ProviderMap;
