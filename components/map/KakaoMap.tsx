'use client';

import { useEffect, useRef, useState } from 'react';

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
    kakaoMapScriptLoaded?: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const loadKakaoMap = () => {
      // 이미 window.kakao가 로드되어 있으면 바로 지도 초기화
      if (window.kakao && window.kakao.maps) {
        console.log('✅ Kakao SDK already loaded, initializing map...');
        initializeMap();
        return;
      }

      // 스크립트가 이미 추가되어 있는지 확인
      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
        console.log('⏳ Kakao script exists, waiting for load...');

        // 이미 로드되었을 수 있으므로 체크
        const checkInterval = setInterval(() => {
          if (window.kakao && window.kakao.maps) {
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            console.log('✅ Kakao SDK loaded via existing script');
            initializeMap();
          }
        }, 100);

        // 타임아웃 (10초)
        timeoutId = setTimeout(() => {
          clearInterval(checkInterval);
          console.error('❌ Kakao Maps script timeout');
          setError('지도 로딩 시간이 초과되었습니다.');
          setIsLoading(false);
        }, 10000);

        // load 이벤트도 같이 리스닝 (아직 로드 안된 경우 대비)
        existingScript.addEventListener('load', () => {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          if (window.kakao && window.kakao.maps) {
            console.log('✅ Kakao SDK loaded via event listener');
            initializeMap();
          }
        }, { once: true });

        return;
      }

      // 새로운 스크립트 추가
      console.log('📥 Loading Kakao Maps SDK...');
      const script = document.createElement('script');
      // iOS Safari 호환성을 위해 명시적으로 https 사용
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
      script.async = true;

      script.onload = () => {
        clearTimeout(timeoutId);
        window.kakaoMapScriptLoaded = true;
        console.log('✅ Kakao Maps SDK script loaded');
        if (window.kakao && window.kakao.maps) {
          initializeMap();
        } else {
          // SDK는 로드되었지만 maps가 없는 경우 약간 대기
          setTimeout(() => {
            if (window.kakao && window.kakao.maps) {
              initializeMap();
            } else {
              setError('지도 SDK 초기화 실패');
              setIsLoading(false);
            }
          }, 100);
        }
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        console.error('❌ Kakao Maps script failed to load');
        setError('지도를 불러오는데 실패했습니다.');
        setIsLoading(false);
      };

      // 타임아웃 (10초)
      timeoutId = setTimeout(() => {
        console.error('❌ Kakao Maps script timeout');
        setError('지도 로딩 시간이 초과되었습니다.');
        setIsLoading(false);
      }, 10000);

      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current) {
        setIsLoading(false);
        return;
      }

      try {
        window.kakao.maps.load(() => {
          if (!mapRef.current) return;

          const options = {
            center: new window.kakao.maps.LatLng(latitude, longitude),
            level: level,
            // 모바일 터치 이벤트 최적화
            draggable: true,
            scrollwheel: true,
            disableDoubleClick: false,
            disableDoubleClickZoom: false,
          };

          const map = new window.kakao.maps.Map(mapRef.current, options);
          mapInstanceRef.current = map;

          // 모바일 디바이스 감지 및 터치 최적화
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
            console.log('📱 Mobile device detected, applying touch optimizations');
            // 모바일에서 지도 컨트롤 활성화
            map.setDraggable(true);
            map.setZoomable(true);
          }

          // 마커 추가
          if (markers.length > 0) {
            markers.forEach(marker => {
              const markerPosition = new window.kakao.maps.LatLng(marker.lat, marker.lng);
              const kakaoMarker = new window.kakao.maps.Marker({
                position: markerPosition,
                map: map,
              });

              if (marker.title) {
                // CustomOverlay로 예쁜 레이블 표시
                const content = document.createElement('div');
                content.style.cssText = `
                  padding: 8px 12px;
                  background: white;
                  border: 2px solid #22c55e;
                  border-radius: 8px;
                  font-size: 13px;
                  font-weight: 600;
                  color: #16a34a;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                  white-space: nowrap;
                  position: relative;
                  bottom: 50px;
                `;
                content.textContent = marker.title;

                const customOverlay = new window.kakao.maps.CustomOverlay({
                  position: markerPosition,
                  content: content,
                  yAnchor: 1,
                });

                customOverlay.setMap(map);
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

          setIsLoading(false);
          console.log('✅ Kakao Map initialized successfully');
        });
      } catch (err) {
        console.error('❌ Error initializing map:', err);
        setError('지도 초기화 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    loadKakaoMap();

    // 클린업: 타임아웃 제거, 스크립트는 제거하지 않고 재사용
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (mapInstanceRef.current) {
        // 지도 인스턴스만 정리
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, level, markers, pathCoordinates]);

  // 에러 상태
  if (error) {
    return (
      <div
        className="w-full h-full rounded-lg flex items-center justify-center bg-gray-100"
        style={{ minHeight: '300px' }}
      >
        <div className="text-center px-4">
          <p className="text-red-600 font-medium mb-2">⚠️ {error}</p>
          <p className="text-sm text-gray-600">새로고침 후 다시 시도해주세요</p>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        className="w-full h-full rounded-lg flex items-center justify-center bg-gray-100"
        style={{ minHeight: '300px' }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">지도 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '300px', height: '100%' }}
    />
  );
}
