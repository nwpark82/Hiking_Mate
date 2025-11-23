import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === 'demo_key') {
    // Demo mode - return mock data
    return NextResponse.json({
      temp: Math.floor(Math.random() * 20) + 5, // 5-25°C
      condition: ['맑음', '흐림', '구름많음'][Math.floor(Math.random() * 3)],
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: (Math.random() * 5 + 1).toFixed(1), // 1-6 m/s
      visibility: 10,
      icon: 'sun',
      demo: true
    });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();

    // Transform API response to our format
    const weatherData = {
      temp: Math.round(data.main.temp),
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed.toFixed(1),
      visibility: (data.visibility / 1000).toFixed(0), // Convert to km
      icon: getWeatherIcon(data.weather[0].main),
      demo: false
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

function getWeatherIcon(condition: string): 'sun' | 'cloud' | 'rain' {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    return 'rain';
  } else if (lowerCondition.includes('cloud')) {
    return 'cloud';
  } else {
    return 'sun';
  }
}
