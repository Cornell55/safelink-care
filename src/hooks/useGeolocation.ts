import { useState, useEffect, useCallback } from "react";

interface GeoPosition {
  latitude: number;
  longitude: number;
}

export function useGeolocation(trackContinuously = false) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => setError(err.message)
    );
  }, []);

  useEffect(() => {
    getPosition();
    if (trackContinuously) {
      const id = navigator.geolocation.watchPosition(
        (pos) => setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => setError(err.message),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
      return () => navigator.geolocation.clearWatch(id);
    }
  }, [trackContinuously, getPosition]);

  return { position, error, refresh: getPosition };
}

export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
