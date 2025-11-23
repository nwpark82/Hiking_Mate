'use client';

import { Cloud, CloudRain, Sun, Wind, Droplets, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
  mountainName?: string;
}

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: 'sun' | 'cloud' | 'rain';
}

export function WeatherWidget({ latitude, longitude, mountainName }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // TODO: OpenWeather API 통합
    // 현재는 더미 데이터를 사용
    // 추후 실제 API 호출로 교체 예정:
    // const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    // fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`)

    setTimeout(() => {
      // 더미 데이터
      setWeather({
        temp: 15,
        condition: '맑음',
        humidity: 65,
        windSpeed: 2.5,
        visibility: 10,
        icon: 'sun'
      });
      setLoading(false);
    }, 500);
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-forest-600 rounded-full"></span>
          날씨 정보
        </h2>
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-6 border border-sky-200 animate-pulse">
          <div className="h-24 bg-white/50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-forest-600 rounded-full"></span>
          날씨 정보
        </h2>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 text-center">
          <Cloud className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">날씨 정보를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  const WeatherIcon = weather.icon === 'sun' ? Sun : weather.icon === 'rain' ? CloudRain : Cloud;
  const iconColor = weather.icon === 'sun' ? 'text-yellow-500' : weather.icon === 'rain' ? 'text-blue-500' : 'text-gray-500';

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-forest-600 rounded-full"></span>
        날씨 정보
        {mountainName && <span className="text-sm font-normal text-gray-600">• {mountainName}</span>}
      </h2>

      <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100/50 rounded-2xl p-6 border border-sky-200 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 bg-white rounded-2xl ${iconColor}`}>
              <WeatherIcon className="w-12 h-12" />
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">{weather.temp}°C</p>
              <p className="text-lg text-gray-700 font-medium">{weather.condition}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/60 rounded-xl p-3 text-center backdrop-blur-sm">
            <Droplets className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600 mb-0.5">습도</p>
            <p className="text-sm font-bold text-gray-900">{weather.humidity}%</p>
          </div>
          <div className="bg-white/60 rounded-xl p-3 text-center backdrop-blur-sm">
            <Wind className="w-5 h-5 text-sky-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600 mb-0.5">풍속</p>
            <p className="text-sm font-bold text-gray-900">{weather.windSpeed}m/s</p>
          </div>
          <div className="bg-white/60 rounded-xl p-3 text-center backdrop-blur-sm">
            <Eye className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600 mb-0.5">가시거리</p>
            <p className="text-sm font-bold text-gray-900">{weather.visibility}km</p>
          </div>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <p className="text-xs text-yellow-800 text-center font-medium">
            {weather.temp < 10 && '🧥 추운 날씨예요. 따뜻한 옷을 준비하세요'}
            {weather.temp >= 10 && weather.temp < 25 && '👍 산행하기 좋은 날씨입니다'}
            {weather.temp >= 25 && '💧 더운 날씨예요. 충분한 물을 준비하세요'}
          </p>
        </div>

        <p className="text-xs text-gray-500 text-center mt-3">
          * 실시간 날씨 정보 (곧 제공 예정)
        </p>
      </div>
    </div>
  );
}
