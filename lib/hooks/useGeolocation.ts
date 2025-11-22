import { useState, useEffect, useCallback } from 'react';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface UseGeolocationOptions {
  continuous?: boolean; // true: 실시간 업데이트, false: 5분마다
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { continuous = false } = options;
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    const handleSuccess = (pos: GeolocationPosition) => {
      setPosition({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        altitudeAccuracy: pos.coords.altitudeAccuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
      });
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('위치 접근 권한이 거부되었습니다.');
          break;
        case err.POSITION_UNAVAILABLE:
          setError('위치 정보를 사용할 수 없습니다.');
          break;
        case err.TIMEOUT:
          setError('위치 정보 요청 시간이 초과되었습니다.');
          break;
        default:
          setError('알 수 없는 오류가 발생했습니다.');
      }
    };

    if (continuous) {
      // 실시간 업데이트 (산행 중)
      const id = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
      setWatchId(id);
    } else {
      // 5분마다 업데이트 (대기 모드)
      // 즉시 한 번 가져오기
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);

      // 5분(300초)마다 업데이트
      const id = setInterval(() => {
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);
      }, 5 * 60 * 1000); // 5분 = 300,000ms

      setIntervalId(id);
    }

    setIsTracking(true);
  }, [continuous]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    if (intervalId !== null) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsTracking(false);
  }, [watchId, intervalId]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [watchId, intervalId]);

  return {
    position,
    error,
    isTracking,
    startTracking,
    stopTracking,
  };
}
