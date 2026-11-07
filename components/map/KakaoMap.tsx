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
  highlightSegments?: Array<[{ lat: number; lng: number }, { lat: number; lng: number }]>;
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
  pathCoordinates = [],
  highlightSegments = []
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
        console.log('🔍 [v2] window.kakao:', !!window.kakao);
        console.log('🔍 [v2] window.kakao.maps:', !!(window.kakao && window.kakao.maps));
        console.log('🔍 [v2] mapRef.current:', !!mapRef.current);

        if (window.kakao && window.kakao.maps) {
          console.log('🔍 [v2] Calling initializeMap...');
          initializeMap();
        } else {
          console.log('⏳ [v2] SDK loaded but maps not ready, waiting 100ms...');
          // SDK는 로드되었지만 maps가 없는 경우 약간 대기
          setTimeout(() => {
            console.log('🔍 [v2] Retry - window.kakao.maps:', !!(window.kakao && window.kakao.maps));
            if (window.kakao && window.kakao.maps) {
              initializeMap();
            } else {
              setError('지도 SDK 초기화 실패');
              setIsLoading(false);
            }
          }, 100);
        }
      };

      script.onerror = (e) => {
        clearTimeout(timeoutId);
        console.error('❌ Kakao Maps script failed to load', e);
        console.error('ℹ️ API Key present:', !!process.env.NEXT_PUBLIC_KAKAO_MAP_KEY);
        console.error('ℹ️ Current domain:', typeof window !== 'undefined' ? window.location.hostname : 'unknown');
        console.error('ℹ️ 해결방법: Kakao Developers 콘솔에서 현재 도메인을 등록하세요');
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
        console.error('❌ Map container ref is null');
        setIsLoading(false);
        return;
      }

      // 컨테이너 크기 확인
      const containerWidth = mapRef.current.offsetWidth;
      const containerHeight = mapRef.current.offsetHeight;
      console.log('📐 Map container dimensions:', { width: containerWidth, height: containerHeight });

      if (containerWidth === 0 || containerHeight === 0) {
        console.error('❌ Map container has zero dimensions, retrying...');
        // 크기가 0이면 약간 대기 후 재시도
        setTimeout(() => {
          if (mapRef.current) {
            const retryWidth = mapRef.current.offsetWidth;
            const retryHeight = mapRef.current.offsetHeight;
            console.log('📐 Retry dimensions:', { width: retryWidth, height: retryHeight });
            if (retryWidth > 0 && retryHeight > 0) {
              initializeMap();
            } else {
              setError('지도 컨테이너 크기를 확인할 수 없습니다.');
              setIsLoading(false);
            }
          }
        }, 200);
        return;
      }

      try {
        console.log('📍 Initializing map with:', { latitude, longitude, level, pathLength: pathCoordinates.length });

        // SDK가 완전히 로드되었는지 확인 (LatLng 클래스가 사용 가능한지)
        const isFullyLoaded = window.kakao.maps.LatLng !== undefined;
        console.log('🔍 SDK fully loaded:', isFullyLoaded);

        const createMap = () => {
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

          console.log('🗺️ Creating Kakao Map instance...');
          const map = new window.kakao.maps.Map(mapRef.current, options);
          console.log('✅ Map instance created:', !!map);
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
            console.log('🛤️ Drawing path with', pathCoordinates.length, 'points');
            console.log('🛤️ First point:', pathCoordinates[0]);
            console.log('🛤️ Last point:', pathCoordinates[pathCoordinates.length - 1]);

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
            console.log('✅ Polyline added to map');

            // 강조 구간 (관리자 화면의 끊긴 구간 등)
            highlightSegments.forEach(([from, to]) => {
              new window.kakao.maps.Polyline({
                path: [
                  new window.kakao.maps.LatLng(from.lat, from.lng),
                  new window.kakao.maps.LatLng(to.lat, to.lng),
                ],
                strokeWeight: 5,
                strokeColor: '#dc2626',
                strokeOpacity: 0.9,
                strokeStyle: 'shortdash',
              }).setMap(map);
            });

            // 경로에 맞게 지도 범위 조정
            const bounds = new window.kakao.maps.LatLngBounds();
            path.forEach((point: any) => bounds.extend(point));
            console.log('📏 Setting map bounds...');
            map.setBounds(bounds);
            console.log('✅ Map bounds set');
          } else {
            console.log('⚠️ No path coordinates provided');
          }

          setIsLoading(false);
          console.log('✅ Kakao Map initialized successfully');

          // 지도 상태 확인
          setTimeout(() => {
            if (mapInstanceRef.current) {
              const center = mapInstanceRef.current.getCenter();
              const currentLevel = mapInstanceRef.current.getLevel();
              console.log('🗺️ Map state after init:', {
                center: { lat: center.getLat(), lng: center.getLng() },
                level: currentLevel
              });
            }
          }, 500);
        };

        // SDK가 이미 완전히 로드되었으면 바로 지도 생성, 아니면 load() 콜백 사용
        if (isFullyLoaded) {
          console.log('📌 SDK already fully loaded, creating map directly');
          createMap();
        } else {
          console.log('📌 Loading SDK via kakao.maps.load()');
          window.kakao.maps.load(createMap);
        }
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
  }, [latitude, longitude, level, markers, pathCoordinates, highlightSegments]);

  // 항상 지도 컨테이너를 렌더링하고, 로딩/에러는 오버레이로 표시
  // 이렇게 해야 mapRef가 항상 DOM에 연결되어 initializeMap()이 정상 작동함
  return (
    <div
      className="w-full h-full rounded-lg"
      style={{
        minHeight: '300px',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 지도 컨테이너 - 항상 렌더링 */}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />

      {/* 에러 오버레이 */}
      {error && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-forest-50 to-sky-50 rounded-lg z-10"
        >
          <div className="text-center px-4">
            <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-2xl shadow-soft flex items-center justify-center">
              <span className="text-3xl">🗺️</span>
            </div>
            <p className="text-gray-700 font-medium mb-1">지도를 불러올 수 없습니다</p>
            <p className="text-sm text-gray-500 mb-3">경로 정보는 아래에서 확인하세요</p>
            {pathCoordinates.length > 0 && (
              <div className="bg-white/80 rounded-xl px-4 py-2 text-sm text-forest-700 inline-flex items-center gap-2">
                <span>📍</span>
                <span>경로 포인트: {pathCoordinates.length}개</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 로딩 오버레이 */}
      {isLoading && !error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10"
        >
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">지도 로딩 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
