"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, Navigation, Clock, Route as RouteIcon, MapPin, Car, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Map.module.css";

const Map = dynamic(() => import("./Map"), { 
  ssr: false,
  loading: () => <div className={styles.mapPlaceholder}>Loading Map...</div>,
});

interface MapContainerProps {
  initialData?: any;
  onClose?: () => void;
}

const MapContainer: React.FC<MapContainerProps> = ({ initialData, onClose }) => {
  const [userLocation, setUserLocation] = useState<[number, number]>([19.0760, 72.8777]); // Default Mumbai
  const [searchQuery, setSearchQuery] = useState("");
  const [destination, setDestination] = useState<[number, number] | null>(initialData?.center || null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [stops, setStops] = useState<any[]>(initialData?.stops || []);
  const [confirmedStops, setConfirmedStops] = useState<any[]>([]);
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);
  const [destinationName, setDestinationName] = useState<string>(initialData?.destination_name || "");
  const [selectedActivities, setSelectedActivities] = useState<Record<number, string[]>>({});

  const toggleActivity = (stopIndex: number, activity: string) => {
    setSelectedActivities(prev => {
      const current = prev[stopIndex] || [];
      if (current.includes(activity)) {
        return { ...prev, [stopIndex]: current.filter(a => a !== activity) };
      } else {
        return { ...prev, [stopIndex]: [...current, activity] };
      }
    });
  };

  useEffect(() => {
    if (initialData) {
      if (initialData.center) {
        setDestination(initialData.center);
      }
      if (initialData.stops && initialData.stops.length > 0) {
        setStops(initialData.stops);
        setExpandedCardIndex(null);
        // Build multi-stop route
        fetchMultiStopRoute(userLocation, initialData.stops);
      } else if (initialData.center) {
        fetchRoute(userLocation, initialData.center);
      }
      if (initialData.destination_name) {
        setDestinationName(initialData.destination_name);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const firstResult = data[0];
        const [lat, lon] = [parseFloat(firstResult.lat), parseFloat(firstResult.lon)];
        
        setDestination([lat, lon]);
        setDestinationName(firstResult.display_name.split(",")[0]);
        fetchRoute(userLocation, [lat, lon]);
      }
    } catch (error) {
      console.error("Error searching for place:", error);
    }
  };

  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        setRouteInfo({
          distance: data.routes[0].distance / 1000,
          duration: data.routes[0].duration / 60,
        });
        const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        setRouteCoordinates(coords);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const fetchMultiStopRoute = async (start: [number, number], stopsArr: any[]) => {
    try {
      // Build waypoints: user location -> stop1 -> stop2 -> ... -> lastStop
      const waypoints = [start, ...stopsArr.filter((s: any) => s.coords).map((s: any) => s.coords)];
      const waypointStr = waypoints.map((w: [number, number]) => `${w[1]},${w[0]}`).join(";");
      
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${waypointStr}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        setRouteInfo({
          distance: data.routes[0].distance / 1000,
          duration: data.routes[0].duration / 60,
        });
        const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        setRouteCoordinates(coords);
      }
    } catch (error) {
      console.error("Error fetching multi-stop route:", error);
      // Fallback: route to center
      if (stopsArr.length > 0 && stopsArr[0].coords) {
        fetchRoute(start, stopsArr[0].coords);
      }
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedCardIndex(expandedCardIndex === index ? null : index);
    if (stops[index]?.coords) {
      setDestination(stops[index].coords);
    }
  };

  const addStopToTrip = (stop: any) => {
    if (confirmedStops.find(s => s.name === stop.name)) return; // Prevent duplicates
    const newConfirmed = [...confirmedStops, stop];
    setConfirmedStops(newConfirmed);
    // Recalculate route with confirmed stops
    fetchMultiStopRoute(userLocation, newConfirmed);
  };

  const removeStop = (idx: number) => {
    const newConfirmed = confirmedStops.filter((_, i) => i !== idx);
    setConfirmedStops(newConfirmed);
    if (newConfirmed.length > 0) {
      fetchMultiStopRoute(userLocation, newConfirmed);
    } else {
      setRouteCoordinates(null);
      setRouteInfo(null);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <div className={styles.searchBox}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {onClose && (
              <button onClick={onClose} className={styles.closeButton} type="button">
                &times;
              </button>
            )}
          </form>
        </div>

        {/* Route info card */}
        {routeInfo && destinationName && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className={styles.routeCard}
          >
            <div className={styles.routeHeader}>
              <Navigation className={styles.navIcon} size={20} />
              <div className={styles.locationInfo}>
                <span className={styles.locationName}>{destinationName}</span>
                <span className={styles.locationAddress}>
                  {stops.length > 0 ? `${stops.length} stops planned` : "Direct route"}
                </span>
              </div>
            </div>
            <div className={styles.routeDetails}>
              <div className={styles.detailItem}>
                <Car size={16} />
                <span>{routeInfo.distance.toFixed(1)} km</span>
              </div>
              <div className={styles.detailItem}>
                <Timer size={16} />
                <span>{formatDuration(routeInfo.duration)}</span>
              </div>
            </div>
          </motion.div>
        )}

        {stops.length > 0 && (
          <div className={styles.placesList}>
            <div className={styles.listHeader}>Itinerary Stops</div>
            {stops.map((stop, idx) => (
              <div 
                key={idx} 
                className={styles.placeCard} 
                onClick={() => toggleExpand(idx)}
              >
                <div className={styles.placeContent}>
                  <div className={styles.placeHeader}>
                    <div className={styles.placeNameRow}>
                      <span className={styles.stopBadge}>{idx + 1}</span>
                      <span className={styles.placeName}>{stop.name}</span>
                    </div>
                    {stop.rating && (
                      <div className={styles.placeRating}>
                        ★ {stop.rating}
                      </div>
                    )}
                  </div>
                  <span className={styles.placeDesc}>{stop.description}</span>
                  {stop.category && (
                    <span className={styles.categoryBadge}>{stop.category}</span>
                  )}
                  
                  {expandedCardIndex === idx && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={styles.expandedInfo}
                    >
                      {stop.estimated_cost && (
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>💰 Cost:</span>
                          <span>{stop.estimated_cost}</span>
                        </div>
                      )}
                      {stop.best_time && (
                        <div className={styles.infoRow}>
                          <Clock size={14} />
                          <span className={styles.infoLabel}>Best Time:</span>
                          <span>{stop.best_time}</span>
                        </div>
                      )}
                      {stop.activities && stop.activities.length > 0 && (
                        <div className={styles.infoRow}>
                          <Navigation size={14} />
                          <span className={styles.infoLabel}>Activities:</span>
                          <div className={styles.activitiesList}>
                            {stop.activities.map((act: string, i: number) => {
                              const isSelected = selectedActivities[idx]?.includes(act);
                              return (
                                <span 
                                  key={i} 
                                  className={`${styles.activityBadge} ${isSelected ? styles.activityBadgeSelected : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleActivity(idx, act);
                                  }}
                                >
                                  {act}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <button 
                        className={styles.addStopButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          addStopToTrip(stop);
                        }}
                      >
                        + Add to My Trip
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {confirmedStops.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={styles.confirmedTripCard}
          >
            <div className={styles.tripHeader}>
              <RouteIcon size={18} />
              <span>Your Trip</span>
              <span className={styles.tripBadge}>{confirmedStops.length} Stops</span>
            </div>
            <div className={styles.tripStops}>
              {confirmedStops.map((s, i) => (
                <div key={i} className={styles.tripStopItem}>
                  <div className={styles.stopNumber}>{i + 1}</div>
                  <div className={styles.stopName}>{s.name}</div>
                  <button 
                    className={styles.removeStop}
                    onClick={() => removeStop(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button 
              className={styles.shareTripButton}
              onClick={() => {
                const text = confirmedStops.map((s, i) => `${i+1}. ${s.name} - ${s.description || ""}`).join("\n");
                navigator.clipboard.writeText(`My Mumbai Trip Plan:\n${text}`);
                alert("Trip itinerary copied to clipboard!");
              }}
            >
              📋 Copy Trip
            </button>
          </motion.div>
        )}
      </div>

      <Map
        center={destination || userLocation}
        zoom={initialData?.zoom || 13}
        destination={destination || undefined}
        routeCoordinates={routeCoordinates || undefined}
        stops={stops}
        confirmedStops={confirmedStops}
        userLocation={userLocation}
      />
    </div>
  );
};

export default MapContainer;
