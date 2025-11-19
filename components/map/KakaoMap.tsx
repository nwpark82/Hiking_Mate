'use client';

import { useEffect, useRef } from 'react';

interface KakaoMapProps {
  latitude: number;
  longitude: number;
  level?: number;
  markers?: Array<{
    lat: number;
    lng: number;
    title?: string;
  }>;
  pathCoordinates?: Array<{ lat: number; lng: number }>;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export function KakaoMap({
  latitude,
  longitude,
  level = 3,
  markers = [],
  pathCoordinates = []
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Kakao Maps SDK 로드
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const options = {
          center: new window.kakao.maps.LatLng(latitude, longitude),
          level: level,
        };

        const map = new window.kakao.maps.Map(mapRef.current, options);
        mapInstanceRef.current = map;

        // 마커 추가
        if (markers.length > 0) {
          markers.forEach(marker => {
            const markerPosition = new window.kakao.maps.LatLng(marker.lat, marker.lng);
            const kakaoMarker = new window.kakao.maps.Marker({
              position: markerPosition,
              map: map,
            });

            if (marker.title) {
              const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:5px;font-size:12px;">${marker.title}</div>`,
              });
              infowindow.open(map, kakaoMarker);
            }
          });
        } else {
          // 기본 마커 (중심점)
          const markerPosition = new window.kakao.maps.LatLng(latitude, longitude);
          new window.kakao.maps.Marker({
            position: markerPosition,
            map: map,
          });
        }

        // 경로 그리기
        if (pathCoordinates.length > 0) {
          const path = pathCoordinates.map(
            coord => new window.kakao.maps.LatLng(coord.lat, coord.lng)
          );

          const polyline = new window.kakao.maps.Polyline({
            path: path,
            strokeWeight: 4,
            strokeColor: '#22c55e',
            strokeOpacity: 0.8,
            strokeStyle: 'solid',
          });

          polyline.setMap(map);

          // 경로에 맞게 지도 범위 조정
          const bounds = new window.kakao.maps.LatLngBounds();
          path.forEach((point: any) => bounds.extend(point));
          map.setBounds(bounds);
        }
      });
    };

    return () => {
      script.remove();
    };
  }, [latitude, longitude, level, markers, pathCoordinates]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '300px' }}
    />
  );
}
