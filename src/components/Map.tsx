"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create numbered icons for stops
function createNumberedIcon(number: number, color: string = "#2f81f7") {
  return L.divIcon({
    className: "custom-numbered-marker",
    html: `<div style="
      background: ${color};
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 2px solid white;
    "><span style="transform: rotate(45deg)">${number}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: `<div style="
    width: 16px;
    height: 16px;
    background: #4285F4;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.3), 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface MapProps {
  center: [number, number];
  zoom: number;
  destination?: [number, number];
  routeCoordinates?: [number, number][];
  stops?: any[];
  confirmedStops?: any[];
  userLocation?: [number, number];
}

// Auto-fit bounds to show all markers
function FitBounds({ stops, userLocation }: { stops: any[]; userLocation?: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (stops.length === 0) return;
    
    const points: [number, number][] = stops
      .filter((s: any) => s.coords)
      .map((s: any) => s.coords);
    
    if (userLocation) points.push(userLocation);
    
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (points.length === 1) {
      map.flyTo(points[0], 14, { duration: 1.5 });
    }
  }, [stops, userLocation, map]);
  
  return null;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom]);
  return null;
}

const Map: React.FC<MapProps> = ({ center, zoom, destination, routeCoordinates, stops, confirmedStops, userLocation }) => {
  const hasStops = stops && stops.length > 0;
  
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ width: "100%", height: "100%", background: "#e8eaed" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {hasStops ? (
        <FitBounds stops={stops!} userLocation={userLocation} />
      ) : (
        <ChangeView center={center} zoom={zoom} />
      )}

      {/* User location (blue dot) */}
      {userLocation && (
        <Marker position={userLocation} icon={userLocationIcon}>
          <Popup>📍 You are here</Popup>
        </Marker>
      )}

      {/* Itinerary Stops (numbered) */}
      {stops?.map((stop, idx) => (
        stop.coords && (
          <Marker 
            key={`stop-${idx}`}
            position={stop.coords}
            icon={createNumberedIcon(idx + 1, "#2f81f7")}
          >
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", minWidth: 180 }}>
                <strong style={{ fontSize: 14 }}>{stop.name}</strong><br/>
                <span style={{ fontSize: 12, color: "#666" }}>{stop.description}</span>
                {stop.estimated_cost && <><br/><span style={{ fontSize: 11, color: "#4ade80" }}>💰 {stop.estimated_cost}</span></>}
                {stop.rating && <><br/><span style={{ fontSize: 11, color: "#f59e0b" }}>⭐ {stop.rating}</span></>}
              </div>
            </Popup>
          </Marker>
        )
      ))}

      {/* Confirmed Trip Stops (green numbered) */}
      {confirmedStops?.map((stop, idx) => (
        stop.coords && (
          <Marker 
            key={`confirmed-${idx}`}
            position={stop.coords}
            icon={createNumberedIcon(idx + 1, "#22c55e")}
          >
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif" }}>
                <strong>✅ Trip Stop {idx + 1}: {stop.name}</strong><br/>
                <span style={{ fontSize: 12, color: "#666" }}>{stop.description}</span>
              </div>
            </Popup>
          </Marker>
        )
      ))}

      {/* Route polyline */}
      {routeCoordinates && routeCoordinates.length > 0 && (
        <Polyline 
          positions={routeCoordinates} 
          pathOptions={{ 
            color: "#2f81f7", 
            weight: 4, 
            opacity: 0.8,
            dashArray: "10 6"
          }} 
        />
      )}
    </MapContainer>
  );
};

export default Map;
