'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ElevationChartProps {
  pathCoordinates: Array<{
    lat: number;
    lng: number;
    altitude?: number;
  }>;
  minAltitude?: number | null;
  maxAltitude?: number | null;
  elevationGain?: number | null;
}

export function ElevationChart({
  pathCoordinates,
  minAltitude,
  maxAltitude,
  elevationGain
}: ElevationChartProps) {
  // 고도 데이터가 있는 좌표만 필터링
  const dataWithAltitude = pathCoordinates.filter(coord => coord.altitude !== undefined);

  if (dataWithAltitude.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500 font-medium">고도 데이터가 없습니다</p>
      </div>
    );
  }

  // 차트 데이터 준비 - 거리를 계산하여 x축으로 사용
  const chartData = dataWithAltitude.map((coord, index) => {
    let distance = 0;

    // 이전 좌표들과의 거리를 누적 계산
    for (let i = 1; i <= index; i++) {
      const prev = dataWithAltitude[i - 1];
      const curr = dataWithAltitude[i];

      // Haversine formula로 거리 계산 (km)
      const R = 6371; // 지구 반지름 (km)
      const dLat = (curr.lat - prev.lat) * Math.PI / 180;
      const dLon = (curr.lng - prev.lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance += R * c;
    }

    return {
      distance: Number(distance.toFixed(2)),
      altitude: coord.altitude,
      displayDistance: distance < 1
        ? `${(distance * 1000).toFixed(0)}m`
        : `${distance.toFixed(1)}km`
    };
  });

  // Y축 범위 설정 (여유 공간 추가)
  const altitudes = dataWithAltitude.map(c => c.altitude!);
  const minY = Math.floor((Math.min(...altitudes) - 50) / 50) * 50;
  const maxY = Math.ceil((Math.max(...altitudes) + 50) / 50) * 50;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">
            {data.displayDistance}
          </p>
          <p className="text-sm text-sunset-600 font-medium">
            {data.altitude}m
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-forest-600 rounded-full"></span>
        고도 프로필
      </h2>

      <div className="bg-gradient-to-br from-white to-sunset-50/30 rounded-2xl p-6 border border-sunset-100 shadow-soft">
        {/* 통계 요약 */}
        {(minAltitude !== undefined || maxAltitude !== undefined || elevationGain !== undefined) && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {minAltitude !== undefined && (
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-600 mb-1">최저</p>
                <p className="text-lg font-bold text-blue-600">{minAltitude}m</p>
              </div>
            )}
            {maxAltitude !== undefined && (
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-600 mb-1">최고</p>
                <p className="text-lg font-bold text-red-600">{maxAltitude}m</p>
              </div>
            )}
            {elevationGain !== undefined && (
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-600 mb-1">누적 상승</p>
                <p className="text-lg font-bold text-sunset-600">+{elevationGain}m</p>
              </div>
            )}
          </div>
        )}

        {/* 차트 */}
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="distance"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => {
                return value < 1 ? `${(value * 1000).toFixed(0)}m` : `${value.toFixed(1)}km`;
              }}
            />
            <YAxis
              domain={[minY, maxY]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `${value}m`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="altitude"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#altitudeGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>

        <p className="text-xs text-gray-500 text-center mt-3">
          거리에 따른 고도 변화
        </p>
      </div>
    </div>
  );
}
