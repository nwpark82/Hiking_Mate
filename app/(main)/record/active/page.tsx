'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { KakaoMap } from '@/components/map/KakaoMap';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getTrailById } from '@/lib/services/trails';
import {
  calculateTotalDistance,
  calculateElevationChange,
  calculatePace,
  calculateCalories,
  formatDuration,
  formatPace,
  calculateDistance,
  calculateBearing,
  bearingToDirection,
} from '@/lib/utils/gps';
import { formatDistance } from '@/lib/utils/helpers';
import type { GPSPoint } from '@/lib/utils/gps';
import type { Trail } from '@/types';
import {
  Play,
  Pause,
  Square,
  Camera,
  TrendingUp,
  Clock,
  Activity,
  Zap,
  Mountain,
  AlertCircle,
  Navigation
} from 'lucide-react';

function ActiveRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trailId = searchParams.get('trailId');
  const { user, loading: authLoading } = useAuth();

  const { position, error: gpsError, isTracking, startTracking, stopTracking } = useGeolocation();

  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pausedTime, setPausedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [trail, setTrail] = useState<Trail | null>(null);
  const [locationAlert, setLocationAlert] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 로그인 확인
  useEffect(() => {
    if (!authLoading && !user) {
      alert('로그인이 필요한 기능입니다.');
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // 트레일 정보 가져오기
  useEffect(() => {
    async function fetchTrail() {
      if (trailId) {
        const trailData = await getTrailById(trailId);
        setTrail(trailData);
      }
    }
    fetchTrail();
  }, [trailId]);

  // 통계 계산
  const distance = calculateTotalDistance(gpsPoints);
  const elevation = calculateElevationChange(gpsPoints);
  const pace = calculatePace(distance, elapsedTime);
  const calories = calculateCalories(distance, elapsedTime);

  // 타이머 업데이트
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - (startTime || Date.now()) - pausedTime);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused, startTime, pausedTime]);

  // GPS 위치 추가
  useEffect(() => {
    if (position && isRecording && !isPaused) {
      setGpsPoints(prev => [
        ...prev,
        {
          latitude: position.latitude,
          longitude: position.longitude,
          altitude: position.altitude,
          timestamp: position.timestamp,
        },
      ]);
    }
  }, [position, isRecording, isPaused]);

  const handleStart = () => {
    // 로그인 확인
    if (!user) {
      alert('로그인이 필요한 기능입니다.');
      router.push('/auth/login');
      return;
    }

    // 현재 위치 확인
    if (!position) {
      alert('GPS 위치를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 트레일 출발지점 확인
    if (trail && trail.start_latitude && trail.start_longitude) {
      const distanceToStart = calculateDistance(
        position.latitude,
        position.longitude,
        trail.start_latitude,
        trail.start_longitude
      );

      const PROXIMITY_THRESHOLD = 25; // 25미터

      if (distanceToStart > PROXIMITY_THRESHOLD) {
        // 거리와 방향 계산
        const bearing = calculateBearing(
          position.latitude,
          position.longitude,
          trail.start_latitude,
          trail.start_longitude
        );
        const direction = bearingToDirection(bearing);
        const distanceInMeters = Math.round(distanceToStart);

        // 알림 메시지 설정
        setLocationAlert(
          `출발지점에서 ${distanceInMeters}m 떨어져 있습니다.\n${direction} 방향으로 이동하여 출발지점 근처(25m 이내)에서 다시 산행 시작 버튼을 눌러주세요.`
        );
        return;
      }
    }

    // 알림 초기화 및 기록 시작
    setLocationAlert(null);
    setIsRecording(true);
    setIsPaused(false);
    setStartTime(Date.now());
    startTracking();
  };

  const handlePause = () => {
    setIsPaused(true);
    setPauseStartTime(Date.now());
  };

  const handleResume = () => {
    setIsPaused(false);
    if (pauseStartTime) {
      const pauseDuration = Date.now() - pauseStartTime;
      setPausedTime(prev => prev + pauseDuration);
      setPauseStartTime(null);
    }
  };

  const handleStop = () => {
    stopTracking();
    setIsRecording(false);

    // 기록 저장 페이지로 이동
    const data = {
      trailId,
      gpsPoints,
      distance,
      duration: Math.floor(elapsedTime / 1000),
      pace,
      calories,
      elevationGain: elevation.gain,
      photos,
      startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
    };

    localStorage.setItem('pendingHike', JSON.stringify(data));
    router.push('/record/save');
  };

  const handlePhotoCapture = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment' as any;

    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPhotos(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  };

  return (
    <>
      <Header title="산행 중" />

      <main className="max-w-screen-lg mx-auto pb-32">
        {/* Map */}
        <section className="h-80 bg-gray-200">
          {position && gpsPoints.length > 0 ? (
            <KakaoMap
              latitude={position.latitude}
              longitude={position.longitude}
              level={3}
              markers={[
                {
                  lat: position.latitude,
                  lng: position.longitude,
                  title: '현재 위치',
                },
              ]}
              pathCoordinates={gpsPoints.map(p => ({ lat: p.latitude, lng: p.longitude }))}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4">
              <Mountain className="w-16 h-16 text-gray-400 mb-4" />
              {gpsError ? (
                <>
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-red-600 text-center">{gpsError}</p>
                  <p className="text-sm text-gray-500 mt-2">위치 권한을 허용해주세요</p>
                </>
              ) : (
                <p className="text-gray-500">GPS 위치를 가져오는 중...</p>
              )}
            </div>
          )}
        </section>

        {/* Timer */}
        <section className="p-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center mb-4">
            <p className="text-sm text-gray-600 mb-2">경과 시간</p>
            <p className="text-5xl font-bold text-gray-900 mb-4">
              {formatDuration(elapsedTime / 1000)}
            </p>

            {isPaused && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <Pause className="w-4 h-4" />
                일시정지 중
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-600">거리</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatDistance(distance)}</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">페이스</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatPace(pace)}</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-600">칼로리</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{calories} kcal</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Mountain className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">누적 상승</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{Math.round(elevation.gain)}m</p>
            </div>
          </div>

          {/* Photos */}
          {photos.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                사진 {photos.length}장
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Control Buttons */}
        <section className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="max-w-screen-lg mx-auto">
            {/* 출발지점 알림 */}
            {locationAlert && !isRecording && (
              <div className="mb-4 bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Navigation className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-orange-900 mb-2">출발지점으로 이동하세요</h4>
                    <p className="text-sm text-orange-800 whitespace-pre-line leading-relaxed">
                      {locationAlert}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isRecording ? (
              <button
                onClick={handleStart}
                disabled={!!gpsError}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-primary-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6 fill-current" />
                산행 시작
              </button>
            ) : (
              <div className="flex gap-3">
                {isPaused ? (
                  <button
                    onClick={handleResume}
                    className="flex-1 bg-primary-600 text-white py-4 px-6 rounded-xl font-bold hover:bg-primary-700 transition flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    재개
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handlePause}
                      className="flex-1 bg-yellow-500 text-white py-4 px-6 rounded-xl font-bold hover:bg-yellow-600 transition flex items-center justify-center gap-2"
                    >
                      <Pause className="w-5 h-5" />
                      일시정지
                    </button>
                    <button
                      onClick={handlePhotoCapture}
                      className="px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={handleStop}
                  className="px-6 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition flex items-center justify-center gap-2"
                >
                  <Square className="w-5 h-5" />
                  종료
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default function ActiveRecordPage() {
  return (
    <Suspense fallback={
      <>
        <Header title="산행 중" />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </>
    }>
      <ActiveRecordContent />
    </Suspense>
  );
}
