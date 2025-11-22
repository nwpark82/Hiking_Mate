export interface GPSPoint {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  timestamp: number;
}

/**
 * 두 GPS 좌표 간의 거리를 계산 (Haversine formula)
 * @returns 거리 (미터)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * GPS 포인트 배열로부터 총 거리 계산
 * @returns 거리 (미터)
 */
export function calculateTotalDistance(points: GPSPoint[]): number {
  if (points.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
  }

  return totalDistance;
}

/**
 * 고도 변화 계산
 * @returns { gain: 누적 상승, loss: 누적 하강 } (미터)
 */
export function calculateElevationChange(points: GPSPoint[]): {
  gain: number;
  loss: number;
} {
  if (points.length < 2) return { gain: 0, loss: 0 };

  let gain = 0;
  let loss = 0;

  for (let i = 1; i < points.length; i++) {
    const prevAlt = points[i - 1].altitude || 0;
    const currAlt = points[i].altitude || 0;
    const diff = currAlt - prevAlt;

    if (diff > 0) {
      gain += diff;
    } else {
      loss += Math.abs(diff);
    }
  }

  return { gain, loss };
}

/**
 * 평균 페이스 계산
 * @param distance 거리 (미터)
 * @param duration 시간 (초)
 * @returns 페이스 (분/km)
 */
export function calculatePace(distance: number, duration: number): number {
  if (distance === 0) return 0;
  const km = distance / 1000;
  const minutes = duration / 60;
  return minutes / km;
}

/**
 * 칼로리 소모량 추정
 * @param distance 거리 (미터)
 * @param duration 시간 (초)
 * @param weight 체중 (kg, 기본값 70)
 * @returns 칼로리 (kcal)
 */
export function calculateCalories(
  distance: number,
  duration: number,
  weight: number = 70
): number {
  // MET (Metabolic Equivalent) 방식
  // 등산 MET: 7.0 (중간 강도 등산)
  const MET = 7.0;
  const hours = duration / 3600;
  const calories = MET * weight * hours;

  return Math.round(calories);
}

/**
 * 시간 포맷팅 (HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 페이스 포맷팅 (M'SS"/km)
 */
export function formatPace(pace: number): string {
  if (!isFinite(pace) || pace === 0) return '-';

  const minutes = Math.floor(pace);
  const seconds = Math.floor((pace - minutes) * 60);
  return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
}

/**
 * 두 지점 사이의 방향 계산 (bearing)
 * @returns 방향 각도 (0-360도)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
}

/**
 * 방향 각도를 8방위로 변환
 * @param bearing 방향 각도 (0-360)
 * @returns 8방위 문자열
 */
export function bearingToDirection(bearing: number): string {
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}
