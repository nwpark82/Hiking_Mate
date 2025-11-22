# 네이티브 앱 마이그레이션 가이드

> PWA → Native App (iOS + Android)  
> Capacitor 하이브리드 방식 (추천)

---

## 📋 목차

1. [왜 네이티브 앱으로 전환하는가?](#왜-네이티브-앱으로-전환하는가)
2. [언제 전환해야 하는가?](#언제-전환해야-하는가)
3. [Capacitor vs React Native 비교](#capacitor-vs-react-native-비교)
4. [Capacitor 마이그레이션 (추천)](#capacitor-마이그레이션-추천)
5. [React Native 마이그레이션](#react-native-마이그레이션)
6. [iOS App Store 배포](#ios-app-store-배포)
7. [Android Google Play 배포](#android-google-play-배포)
8. [코드 재사용 전략](#코드-재사용-전략)
9. [테스트 전략](#테스트-전략)
10. [배포 체크리스트](#배포-체크리스트)

---

## 왜 네이티브 앱으로 전환하는가?

### PWA의 한계

```bash
1. 백그라운드 위치 추적
   ❌ iOS: 완전히 불가능
   ⚠️ Android: 제한적

2. 앱 스토어 노출
   ❌ App Store에서 검색 안 됨
   ❌ 유기적 다운로드 불가능

3. 푸시 알림
   ❌ iOS: 매우 제한적 (iOS 16.4+만 부분 지원)
   ✅ Android: 완벽 지원

4. 네이티브 기능
   ❌ HealthKit (건강 데이터)
   ❌ 위젯
   ❌ Siri Shortcuts
   ❌ App Clips
```

### 네이티브 앱의 장점

```bash
✅ 완벽한 백그라운드 위치 추적
✅ App Store/Play Store 노출
✅ 모든 네이티브 기능 접근
✅ 더 나은 성능
✅ 오프라인 지원 강화
✅ 앱 내 결제 (IAP)
✅ 위젯, Shortcuts 등
```

---

## 언제 전환해야 하는가?

### Phase 2: 백그라운드 위치 추적 필요 시 (Capacitor)

```bash
조건:
✅ DAU 1,000명 이상
✅ 경로 추적이 핵심 기능
✅ 사용자 피드백 수집 완료
✅ PWA 버전 안정화

시기: Phase 2 (실시간 기능 추가 시)
방법: Capacitor로 래핑
```

### Phase 3: 완전한 네이티브 경험 필요 시 (React Native)

```bash
조건:
✅ DAU 5,000명 이상
✅ 복잡한 네이티브 기능 필요
✅ 최고 성능 필요
✅ 충분한 개발 예산

시기: Phase 3 이후
방법: React Native 재개발
```

---

## Capacitor vs React Native 비교

### 비교표

| 항목 | Capacitor | React Native |
|------|-----------|--------------|
| **개발 방식** | 기존 PWA 래핑 | 완전히 새로 개발 |
| **코드 재사용** | 95% | 30-40% (로직만) |
| **개발 기간** | 2-3주 | 2-3개월 |
| **성능** | 웹뷰 기반 (약간 느림) | 네이티브 (빠름) |
| **유지보수** | 하나의 코드베이스 | iOS + Android 각각 |
| **네이티브 기능** | 플러그인 통해 접근 | 완전한 접근 |
| **업데이트** | 웹 부분 즉시 반영 | 모두 심사 필요 |
| **비용** | 낮음 | 높음 |
| **적합성** | 하이킹메이트 ✅ | 복잡한 앱 |

### 결론: Capacitor 추천!

```bash
이유:
✅ 기존 PWA 코드 그대로 사용
✅ 빠른 마이그레이션 (2주)
✅ 낮은 비용
✅ 백그라운드 위치 추적 가능
✅ 하나의 코드베이스 유지

React Native는:
❌ 3개월 재개발 필요
❌ 높은 비용
❌ 불필요한 복잡성
```

---

## Capacitor 마이그레이션 (추천)

### 전체 프로세스 (2-3주)

```
Week 1: Capacitor 설정 및 기본 래핑
Week 2: 네이티브 플러그인 추가 (위치, 알림)
Week 3: 테스트 및 앱 스토어 제출
```

---

## 📝 Step 1: 환경 준비 (1일)

### 1.1 필요한 도구 설치

```bash
# macOS (iOS 개발 필수)
1. Xcode 설치
   - App Store에서 Xcode 다운로드
   - 용량: 약 12GB
   - 최신 버전 필수 (15.0+)

2. Xcode Command Line Tools
   xcode-select --install

3. CocoaPods 설치 (iOS 의존성 관리)
   sudo gem install cocoapods

# Android 개발
1. Android Studio 설치
   - https://developer.android.com/studio
   - 용량: 약 3GB

2. Android SDK 설치
   - Android Studio 실행
   - SDK Manager에서 SDK 설치
   - API Level 33 (Android 13) 이상

3. 환경변수 설정
   # ~/.zshrc 또는 ~/.bash_profile
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 1.2 개발자 계정 생성

```bash
# Apple Developer Account
1. https://developer.apple.com 접속
2. 계정 생성
3. Apple Developer Program 가입
   - 비용: $129/년 (₩약 17만원)
   - 개인 또는 조직 선택
   - 승인: 1-2일 소요

# Google Play Console
1. https://play.google.com/console 접속
2. 계정 생성
3. 개발자 등록
   - 비용: $25 (1회, ₩약 3.3만원)
   - 즉시 승인

총 초기 비용: $154 (₩약 20만원)
```

---

## 📝 Step 2: Capacitor 설치 및 초기화 (1일)

### 2.1 Capacitor 설치

```bash
# 프로젝트 루트에서 실행

# 1. Capacitor CLI 설치
npm install @capacitor/core @capacitor/cli

# 2. Capacitor 초기화
npx cap init

# 입력 사항:
? App name: 하이킹메이트
? App package ID: com.hikingmate.app
? (중요!) iOS, Android 모두 동일한 ID 사용
```

### 2.2 플랫폼 추가

```bash
# iOS 플랫폼 추가
npm install @capacitor/ios
npx cap add ios

# Android 플랫폼 추가
npm install @capacitor/android
npx cap add android

# 결과 확인
ls -la
# ios/ 폴더 생성됨
# android/ 폴더 생성됨
```

### 2.3 capacitor.config.ts 설정

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hikingmate.app',
  appName: '하이킹메이트',
  webDir: 'out', // Next.js static export 폴더
  server: {
    androidScheme: 'https', // 중요!
    hostname: 'hikingmate.app'
  },
  plugins: {
    // 플러그인 설정은 나중에 추가
  }
};

export default config;
```

### 2.4 Next.js Static Export 설정

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 중요! Static export 활성화
  images: {
    unoptimized: true // Image 최적화 비활성화 (필수)
  },
  trailingSlash: true, // URL 끝에 / 추가
};

module.exports = nextConfig;
```

### 2.5 빌드 및 동기화

```bash
# 1. Next.js 빌드
npm run build

# 2. Capacitor 동기화
npx cap sync

# 이 명령어는:
# - out/ 폴더를 ios/android로 복사
# - 네이티브 의존성 설치
# - 플러그인 설정
```

---

## 📝 Step 3: 네이티브 플러그인 추가 (3-4일)

### 3.1 백그라운드 위치 추적 플러그인

```bash
# Capacitor Background Geolocation 설치
npm install @capacitor-community/background-geolocation

# iOS 설정 (중요!)
npx cap sync ios
```

#### iOS 설정 파일 수정

```xml
<!-- ios/App/App/Info.plist -->
<!-- Claude Code에게: 이 파일을 열어서 <dict> 태그 안에 추가하세요 -->

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>산행 중 경로를 추적하고 이탈 시 알림을 보내기 위해 위치 권한이 필요합니다.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>현재 위치를 확인하고 등산로를 추적하기 위해 위치 권한이 필요합니다.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>앱이 백그라운드에 있을 때도 경로를 추적하기 위해 위치 권한이 필요합니다.</string>

<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>fetch</string>
</array>
```

#### Android 설정 파일 수정

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<!-- Claude Code에게: <manifest> 태그 안에 추가하세요 -->

<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />

<!-- <application> 태그 안에 추가 -->
<service 
    android:name="com.capacitor.community.backgroundgeolocation.BackgroundGeolocationService"
    android:foregroundServiceType="location" />
```

### 3.2 로컬 알림 플러그인

```bash
# Capacitor Local Notifications 설치
npm install @capacitor/local-notifications

npx cap sync
```

#### iOS 알림 설정

```xml
<!-- ios/App/App/Info.plist -->

<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>fetch</string>
  <string>remote-notification</string> <!-- 추가 -->
</array>
```

#### Android 알림 설정

```xml
<!-- android/app/src/main/AndroidManifest.xml -->

<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

### 3.3 푸시 알림 플러그인 (FCM)

```bash
# Capacitor Push Notifications 설치
npm install @capacitor/push-notifications

npx cap sync
```

#### Firebase 설정

```bash
# iOS용 GoogleService-Info.plist
1. Firebase Console에서 다운로드
2. ios/App/App/GoogleService-Info.plist에 복사

# Android용 google-services.json
1. Firebase Console에서 다운로드
2. android/app/google-services.json에 복사
```

```gradle
// android/build.gradle
// Claude Code에게: dependencies에 추가하세요

buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

```gradle
// android/app/build.gradle
// Claude Code에게: 파일 맨 아래에 추가하세요

apply plugin: 'com.google.gms.google-services'
```

### 3.4 기타 유용한 플러그인

```bash
# App 상태 확인
npm install @capacitor/app

# Network 상태 확인
npm install @capacitor/network

# Storage
npm install @capacitor/preferences

# Camera
npm install @capacitor/camera

# Filesystem
npm install @capacitor/filesystem

# Haptics (진동)
npm install @capacitor/haptics

# Status Bar
npm install @capacitor/status-bar

# 모두 동기화
npx cap sync
```

---

## 📝 Step 4: TypeScript 코드 작성 (2-3일)

### 4.1 플러그인 래퍼 작성

#### 위치 추적 래퍼

```typescript
// lib/native/location-tracker.ts
// Claude Code에게: 이 파일을 생성하세요

import { BackgroundGeolocation } from '@capacitor-community/background-geolocation';
import { Capacitor } from '@capacitor/core';

export class NativeLocationTracker {
  private watcherId: string | null = null;
  
  /**
   * 백그라운드 위치 추적 시작
   * 
   * @param trailId - 추적할 등산로 ID
   * @param onLocation - 위치 업데이트 콜백
   * 
   * 설명:
   * - iOS/Android에서 백그라운드 위치 추적 시작
   * - 10m마다 위치 업데이트
   * - 포그라운드 알림 표시 (Android)
   */
  async startTracking(
    trailId: string,
    onLocation: (location: any) => void
  ): Promise<void> {
    // 네이티브 플랫폼 체크
    if (!Capacitor.isNativePlatform()) {
      console.warn('네이티브 플랫폼이 아닙니다. 웹 Geolocation 사용');
      return;
    }

    // 권한 요청
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('위치 권한이 거부되었습니다.');
    }

    // 백그라운드 위치 추적 시작
    this.watcherId = await BackgroundGeolocation.addWatcher(
      {
        // 백그라운드 알림 (Android)
        backgroundTitle: '산행 추적 중',
        backgroundMessage: '안전한 산행을 위해 위치를 추적하고 있습니다',
        
        // 권한 요청
        requestPermissions: true,
        
        // 오래된 위치 무시
        stale: false,
        
        // 최소 이동 거리 (미터)
        distanceFilter: 10,
      },
      (location, error) => {
        if (error) {
          console.error('위치 추적 에러:', error);
          return;
        }
        
        if (location) {
          onLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            altitude: location.altitude,
            accuracy: location.accuracy,
            timestamp: Date.now()
          });
        }
      }
    );
    
    console.log('✅ 백그라운드 위치 추적 시작:', this.watcherId);
  }
  
  /**
   * 위치 권한 요청
   * 
   * 설명:
   * - iOS: "항상 허용" 권한 요청
   * - Android: FINE_LOCATION + BACKGROUND_LOCATION
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      // iOS: 먼저 "사용 중일 때" 권한 요청
      const result = await BackgroundGeolocation.requestPermissions();
      
      if (result === 'granted') {
        // 그 다음 "항상 허용" 권한 요청 (iOS)
        // Android는 자동으로 처리됨
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('권한 요청 실패:', error);
      return false;
    }
  }
  
  /**
   * 위치 추적 중지
   */
  async stopTracking(): Promise<void> {
    if (this.watcherId) {
      await BackgroundGeolocation.removeWatcher({
        id: this.watcherId
      });
      
      this.watcherId = null;
      console.log('✅ 백그라운드 위치 추적 중지');
    }
  }
}
```

#### 알림 래퍼

```typescript
// lib/native/notification-manager.ts
// Claude Code에게: 이 파일을 생성하세요

import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export class NativeNotificationManager {
  /**
   * 로컬 알림 초기화
   * 
   * 설명:
   * - 권한 요청
   * - 알림 채널 생성 (Android)
   */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('네이티브 플랫폼이 아닙니다.');
      return;
    }

    // 권한 요청
    const result = await LocalNotifications.requestPermissions();
    
    if (result.display === 'granted') {
      console.log('✅ 로컬 알림 권한 허용됨');
    } else {
      console.warn('⚠️ 로컬 알림 권한 거부됨');
    }
  }
  
  /**
   * 경로 이탈 알림
   * 
   * @param distance - 등산로로부터의 거리 (미터)
   * 
   * 설명:
   * - 즉시 표시되는 알림
   * - 진동 + 소리
   */
  async sendDeviationAlert(distance: number): Promise<void> {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: '⚠️ 경로 이탈',
          body: `등산로에서 ${Math.round(distance)}m 벗어났습니다. 경로를 확인하세요.`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) }, // 1초 후
          sound: 'beep.wav',
          smallIcon: 'ic_stat_icon', // Android
          largeIcon: 'ic_launcher', // Android
          iconColor: '#FF0000',
          attachments: undefined,
          actionTypeId: '',
          extra: {
            type: 'deviation',
            distance
          }
        }
      ]
    });
    
    // 진동
    if (Capacitor.getPlatform() === 'ios') {
      // iOS: Haptics API 사용
      const { Haptics } = await import('@capacitor/haptics');
      await Haptics.vibrate({ duration: 500 });
    } else {
      // Android: 기본 진동
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }
  
  /**
   * 일몰 알림
   * 
   * @param sunsetTime - 일몰 시간 (Date)
   * 
   * 설명:
   * - 일몰 1시간 전에 알림 예약
   */
  async scheduleSunsetAlert(sunsetTime: Date): Promise<void> {
    const oneHourBefore = new Date(sunsetTime.getTime() - 60 * 60 * 1000);
    
    await LocalNotifications.schedule({
      notifications: [
        {
          title: '🌅 일몰 알림',
          body: '일몰까지 1시간 남았습니다. 하산을 서두르세요.',
          id: Date.now(),
          schedule: { at: oneHourBefore },
          sound: 'default',
          extra: {
            type: 'sunset',
            sunsetTime: sunsetTime.toISOString()
          }
        }
      ]
    });
    
    console.log('✅ 일몰 알림 예약:', oneHourBefore.toLocaleString());
  }
  
  /**
   * FCM 푸시 알림 초기화
   * 
   * 설명:
   * - FCM 토큰 가져오기
   * - Supabase에 저장
   */
  async initializePushNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    // 권한 요청
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('푸시 알림 권한 거부됨');
      return;
    }

    // FCM 등록
    await PushNotifications.register();

    // 토큰 받기
    PushNotifications.addListener('registration', (token) => {
      console.log('✅ FCM 토큰:', token.value);
      // TODO: Supabase에 저장
      this.saveFCMToken(token.value);
    });

    // 알림 수신 리스너
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('푸시 알림 수신:', notification);
    });

    // 알림 클릭 리스너
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('푸시 알림 클릭:', notification);
      // TODO: 알림에 따라 화면 이동
    });
  }
  
  private async saveFCMToken(token: string): Promise<void> {
    // TODO: Supabase에 FCM 토큰 저장
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('fcm_tokens').upsert({
          user_id: user.id,
          token,
          platform: Capacitor.getPlatform(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('FCM 토큰 저장 실패:', error);
    }
  }
}
```

### 4.2 플랫폼 감지 훅

```typescript
// lib/hooks/usePlatform.ts
// Claude Code에게: 이 파일을 생성하세요

import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export function usePlatform() {
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const currentPlatform = Capacitor.getPlatform();
    setPlatform(currentPlatform as any);
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return {
    platform,
    isNative,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web'
  };
}
```

### 4.3 조건부 렌더링

```typescript
// components/TrackingButton.tsx
// Claude Code에게: 기존 컴포넌트를 이렇게 수정하세요

'use client';

import { usePlatform } from '@/lib/hooks/usePlatform';
import { NativeLocationTracker } from '@/lib/native/location-tracker';
import { useState } from 'react';

export function TrackingButton() {
  const { isNative } = usePlatform();
  const [tracker] = useState(() => new NativeLocationTracker());
  const [isTracking, setIsTracking] = useState(false);

  const handleStart = async () => {
    if (isNative) {
      // 네이티브: 백그라운드 추적
      await tracker.startTracking('trail-123', (location) => {
        console.log('위치 업데이트:', location);
        // TODO: 경로 이탈 체크
      });
    } else {
      // 웹: 포그라운드 추적
      navigator.geolocation.watchPosition((position) => {
        console.log('웹 위치:', position);
      });
    }
    
    setIsTracking(true);
  };

  const handleStop = async () => {
    if (isNative) {
      await tracker.stopTracking();
    }
    setIsTracking(false);
  };

  return (
    <div>
      {!isTracking ? (
        <button onClick={handleStart} className="btn-primary">
          산행 시작
        </button>
      ) : (
        <button onClick={handleStop} className="btn-danger">
          산행 종료
        </button>
      )}
      
      {isNative && (
        <p className="text-xs text-green-600 mt-2">
          ✅ 백그라운드에서도 추적됩니다
        </p>
      )}
    </div>
  );
}
```

---

## 📝 Step 5: 빌드 및 테스트 (2-3일)

### 5.1 iOS 빌드

```bash
# 1. Next.js 빌드
npm run build

# 2. Capacitor 동기화
npx cap sync ios

# 3. Xcode 열기
npx cap open ios

# Xcode에서:
# 1. 왼쪽 프로젝트 네비게이터에서 'App' 선택
# 2. 'Signing & Capabilities' 탭 선택
# 3. Team 선택 (Apple Developer 계정)
# 4. Bundle Identifier 확인: com.hikingmate.app
# 5. 시뮬레이터 선택 (iPhone 15 Pro 추천)
# 6. ▶️ 버튼 클릭 (또는 Cmd+R)
```

### 5.2 Android 빌드

```bash
# 1. Next.js 빌드
npm run build

# 2. Capacitor 동기화
npx cap sync android

# 3. Android Studio 열기
npx cap open android

# Android Studio에서:
# 1. 상단 메뉴 Build > Make Project
# 2. AVD Manager에서 에뮬레이터 실행
# 3. Run > Run 'app' (또는 Shift+F10)
```

### 5.3 실기기 테스트

#### iOS 실기기 테스트

```bash
# 1. iPhone을 Mac에 USB 연결

# 2. Xcode에서:
# - 상단 디바이스 선택 메뉴에서 연결된 iPhone 선택
# - ▶️ 버튼 클릭

# 3. iPhone에서:
# - 설정 > 일반 > VPN 및 기기 관리
# - 개발자 앱 신뢰
```

#### Android 실기기 테스트

```bash
# 1. Android 폰 설정:
# - 설정 > 휴대전화 정보 > 빌드 번호 7번 탭 (개발자 옵션 활성화)
# - 설정 > 개발자 옵션 > USB 디버깅 활성화

# 2. USB 연결

# 3. Android Studio에서:
# - 상단 디바이스 선택 메뉴에서 연결된 폰 선택
# - Run 버튼 클릭
```

---

## 📝 Step 6: App Icon 및 Splash Screen (1일)

### 6.1 아이콘 준비

```bash
# 필요한 아이콘:
# - 1024x1024 PNG (마스터 이미지)
# - 배경 투명하지 않음
# - 고해상도

# 온라인 도구 사용 (추천):
https://icon.kitchen
또는
https://appicon.co

# 업로드 후:
# - iOS 아이콘 세트 다운로드
# - Android 아이콘 세트 다운로드
```

### 6.2 iOS 아이콘 설정

```bash
# 1. 다운로드한 iOS 아이콘을 복사:
ios/App/App/Assets.xcassets/AppIcon.appiconset/

# 2. Xcode에서 확인:
# - App > Assets.xcassets > AppIcon
# - 모든 크기의 아이콘이 표시되는지 확인
```

### 6.3 Android 아이콘 설정

```bash
# 1. 다운로드한 Android 아이콘을 복사:
android/app/src/main/res/

# 폴더 구조:
# mipmap-mdpi/
# mipmap-hdpi/
# mipmap-xhdpi/
# mipmap-xxhdpi/
# mipmap-xxxhdpi/

# 2. Android Studio에서 확인:
# - app > res > mipmap
# - 모든 밀도의 아이콘 확인
```

### 6.4 Splash Screen 설정

```bash
# Capacitor Splash Screen 플러그인 설치
npm install @capacitor/splash-screen

npx cap sync
```

#### iOS Splash Screen

```bash
# 1. LaunchScreen.storyboard 편집
# Xcode에서:
# - App > App > Base.lproj > LaunchScreen.storyboard
# - 로고 이미지 추가
# - 배경색 설정: #16a34a (녹색)
```

#### Android Splash Screen

```xml
<!-- android/app/src/main/res/values/styles.xml -->
<!-- Claude Code에게: 이 파일을 수정하세요 -->

<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowBackground">@drawable/splash</item>
    </style>
</resources>
```

```xml
<!-- android/app/src/main/res/drawable/splash.xml -->
<!-- Claude Code에게: 이 파일을 생성하세요 -->

<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@mipmap/ic_launcher"/>
    </item>
</layer-list>
```

---

## 📝 Step 7: iOS App Store 배포 (3-5일)

### 7.1 App Store Connect 준비

```bash
# 1. App Store Connect 접속
https://appstoreconnect.apple.com

# 2. 앱 등록
- 'My Apps' 클릭
- '+' 버튼 > 'New App'

# 3. 앱 정보 입력:
Name: 하이킹메이트
Primary Language: Korean
Bundle ID: com.hikingmate.app (Xcode와 동일해야 함)
SKU: hikingmate-001 (고유 식별자)

# 4. 가격 및 사용 가능성:
Price: Free (무료)
Availability: 모든 국가
```

### 7.2 앱 메타데이터 작성

```bash
# Claude Code에게: 이 정보들을 App Store Connect에 입력하세요

# 앱 이름
하이킹메이트

# 부제목 (30자)
안전한 산행을 위한 똑똑한 동반자

# 프로모션 텍스트 (170자, 업데이트 가능)
실시간 GPS 경로 추적으로 안전하게 등산하세요. 전국 등산로 정보와 커뮤니티가 함께합니다.

# 설명 (4000자)
🏔 하이킹메이트 - 당신의 산행 파트너

안전하고 즐거운 등산을 위한 종합 플랫폼입니다.

주요 기능:
✅ 실시간 GPS 경로 추적
- 백그라운드에서도 안전하게 추적
- 경로 이탈 시 즉시 알림
- 이동 거리, 시간, 고도 자동 기록

✅ 전국 등산로 정보
- 5,000개 이상의 등산로 정보
- 난이도, 소요시간, 거리 상세 안내
- 실시간 날씨 및 일몰 시간

✅ 산행 기록 및 공유
- 내 산행 자동 기록
- 사진과 함께 추억 저장
- 커뮤니티에 공유

✅ 안전 기능
- 일몰 1시간 전 알림
- 경로 이탈 감지 및 알림
- 긴급 SOS 기능

✅ 커뮤니티
- 다른 등산객들과 정보 공유
- 등산로 리뷰 및 팁
- 산행 메이트 찾기

하이킹메이트와 함께 안전하고 즐거운 산행을 시작하세요!

# 키워드 (100자, 쉼표로 구분)
등산,산행,트레킹,GPS,위치추적,등산로,산,hiking,trail,outdoor

# 지원 URL
https://hikingmate.app/support

# 마케팅 URL
https://hikingmate.app

# 개인정보처리방침 URL
https://hikingmate.app/privacy
```

### 7.3 스크린샷 준비

```bash
# 필요한 스크린샷 크기:

# iPhone 6.7" (필수)
1290 x 2796 픽셀
- iPhone 15 Pro Max, 14 Pro Max, 13 Pro Max

# iPhone 6.5" (필수)
1242 x 2688 픽셀  
- iPhone 11 Pro Max, XS Max

# 스크린샷 개수: 3-10개 (5-6개 추천)

# 추천 구성:
1. 메인 화면 (등산로 목록)
2. 등산로 상세 정보
3. GPS 실시간 추적 화면
4. 경로 이탈 알림
5. 산행 기록 및 통계
6. 커뮤니티 게시글

# 스크린샷 촬영 방법:
# 1. Xcode 시뮬레이터에서 앱 실행
# 2. Cmd+S로 스크린샷 저장
# 또는
# 실기기에서 촬영 후 iTunes Connect에 업로드
```

### 7.4 앱 심사 정보

```bash
# 연락처 정보
First Name: [이름]
Last Name: [성]
Phone: +82-10-XXXX-XXXX
Email: support@hikingmate.app

# 데모 계정 (심사용)
Username: reviewer@hikingmate.app
Password: Review2024!
추가 정보: 로그인 후 모든 기능 테스트 가능합니다.

# 참고사항
이 앱은 GPS 위치 추적을 사용하여 등산객의 안전을 보장합니다.
백그라운드 위치 추적은 사용자가 산행을 시작할 때만 활성화됩니다.
배터리 최적화를 통해 전력 소모를 최소화했습니다.

# 수출 규정 준수
Does your app use encryption? No
(또는 Yes인 경우 추가 문서 제출 필요)
```

### 7.5 Xcode에서 Archive 및 업로드

```bash
# 1. 버전 번호 설정
# Xcode에서:
# - App > Targets > App > General
# - Version: 1.0.0
# - Build: 1

# 2. Release 모드 설정
# - Product > Scheme > Edit Scheme
# - Run > Build Configuration: Release

# 3. Archive 생성
# - Product > Archive
# - 5-10분 소요
# - Archive가 성공하면 Organizer 창이 열림

# 4. App Store Connect에 업로드
# - Organizer에서 'Distribute App' 클릭
# - App Store Connect 선택
# - Upload 클릭
# - 자동으로 업로드 (10-20분)

# 5. 처리 완료 대기
# - App Store Connect에서 '처리 중' 표시
# - 이메일로 완료 알림 (1-2시간)
```

### 7.6 심사 제출

```bash
# App Store Connect에서:

# 1. 빌드 선택
# - 버전 선택 (1.0.0)
# - '처리 완료' 상태 확인
# - 빌드 선택 버튼 클릭

# 2. 심사 제출
# - 'Submit for Review' 클릭
# - 모든 정보 확인
# - 제출

# 3. 심사 기간
# - 평균: 1-3일
# - 최대: 5-7일

# 4. 심사 결과
# - 승인: 자동으로 'Ready for Sale' 상태
# - 거절: 수정 사항 안내 이메일
```

### 7.7 흔한 거절 사유 및 대응

```bash
# 1. 위치 권한 설명 불충분
문제: "앱이 위치를 왜 사용하는지 명확하지 않음"
해결: Info.plist의 권한 설명 더 상세하게 작성
"산행 중 실시간 경로 추적 및 안전을 위해..."

# 2. 백그라운드 모드 정당성
문제: "백그라운드 위치 사용 이유 불명확"
해결: 심사 노트에 명확히 설명
"등산객이 경로에서 이탈할 경우 즉시 알림..."

# 3. 테스트 계정 문제
문제: "로그인 안 됨" 또는 "기능 테스트 불가"
해결: 
- 데모 계정 다시 확인
- 모든 기능 접근 가능한지 테스트
- 심사 노트에 사용법 상세 기재

# 4. 스크린샷 불일치
문제: "스크린샷이 실제 앱과 다름"
해결: 최신 버전으로 다시 촬영

# 5. 개인정보처리방침 누락
문제: "개인정보 수집 관련 정책 없음"
해결: 
- 개인정보처리방침 페이지 작성
- URL을 App Store Connect에 등록
```

---

## 📝 Step 8: Android Google Play 배포 (2-3일)

### 8.1 Google Play Console 준비

```bash
# 1. Google Play Console 접속
https://play.google.com/console

# 2. 앱 만들기
- 'Create app' 클릭

# 3. 앱 세부정보:
App name: 하이킹메이트
Default language: Korean
App or game: App
Free or paid: Free

# 4. 선언:
- 개발자 프로그램 정책 동의
- 미국 수출법 준수 동의
```

### 8.2 앱 메타데이터 작성

```bash
# Store listing 섹션

# 짧은 설명 (80자)
실시간 GPS로 안전한 산행! 전국 등산로 정보와 커뮤니티

# 자세한 설명 (4000자)
🏔 하이킹메이트 - 당신의 산행 파트너

안전하고 즐거운 등산을 위한 종합 플랫폼입니다.

[주요 기능]
✅ 실시간 GPS 경로 추적
• 백그라운드에서도 안전하게 추적
• 경로 이탈 시 즉시 알림
• 이동 거리, 시간, 고도 자동 기록

✅ 전국 등산로 정보
• 5,000개 이상의 등산로 정보
• 난이도, 소요시간, 거리 상세 안내
• 실시간 날씨 및 일몰 시간

✅ 산행 기록 및 공유
• 내 산행 자동 기록
• 사진과 함께 추억 저장
• 커뮤니티에 공유

✅ 안전 기능
• 일몰 1시간 전 알림
• 경로 이탈 감지 및 알림
• 긴급 SOS 기능

✅ 커뮤니티
• 다른 등산객들과 정보 공유
• 등산로 리뷰 및 팁
• 산행 메이트 찾기

[권한 안내]
• 위치: 실시간 경로 추적 및 등산로 탐색
• 카메라: 산행 중 사진 촬영
• 저장소: 산행 기록 저장
• 알림: 경로 이탈 및 안전 알림

하이킹메이트와 함께 안전하고 즐거운 산행을 시작하세요!

문의: support@hikingmate.app
```

### 8.3 그래픽 에셋 준비

```bash
# 앱 아이콘
512 x 512 픽셀 (PNG, 32bit)

# 기능 그래픽
1024 x 500 픽셀 (PNG 또는 JPG)
- Play Store 상단 배너 이미지

# 스크린샷
- 최소 2개, 최대 8개
- 16:9 또는 9:16 비율
- 1080 x 1920 픽셀 이상

# 추천 구성:
1. 메인 화면
2. 등산로 상세
3. GPS 추적 화면
4. 경로 이탈 알림
5. 산행 기록
6. 커뮤니티
```

### 8.4 콘텐츠 등급

```bash
# Play Console > Content rating

# 질문지 작성:
1. 앱이 폭력을 묘사하나요? No
2. 성인 콘텐츠가 있나요? No
3. 욕설이 포함되나요? No
4. 사용자 생성 콘텐츠가 있나요? Yes (커뮤니티)
5. 위치 공유 기능이 있나요? Yes

# 결과: 
모든 연령 (Everyone) 또는 청소년 이상 (Teen)
```

### 8.5 앱 액세스

```bash
# 제한된 기능이 있는 경우:

# 데모 계정 제공:
Username: reviewer@hikingmate.app
Password: Review2024!

사용 방법:
1. 앱 설치 후 "로그인" 클릭
2. 위 계정으로 로그인
3. "산행 시작" 버튼으로 GPS 추적 테스트
4. 커뮤니티 탭에서 게시글 확인
```

### 8.6 개인정보처리방침

```bash
# 필수 항목:

개인정보처리방침 URL:
https://hikingmate.app/privacy

# 내용 포함 사항:
- 수집하는 정보: 위치, 이메일, 프로필
- 사용 목적: 경로 추적, 서비스 제공
- 제3자 공유: Firebase, Supabase
- 보관 기간: 회원 탈퇴 시까지
- 사용자 권리: 정보 열람, 수정, 삭제
```

### 8.7 AAB 빌드 및 업로드

```bash
# 1. 키스토어 생성 (최초 1회)
cd android/app

keytool -genkey -v -keystore hikingmate.keystore -alias hikingmate -keyalg RSA -keysize 2048 -validity 10000

# 정보 입력:
Enter keystore password: [안전한 비밀번호]
Re-enter new password: [동일하게]
What is your first and last name? [이름]
What is the name of your organizational unit? HikingMate
What is the name of your organization? HikingMate
What is the name of your City or Locality? Seoul
What is the name of your State or Province? Seoul
What is the two-letter country code for this unit? KR

# ⚠️ 중요: 비밀번호와 파일 안전하게 보관!
# 분실 시 앱 업데이트 불가능!
```

```gradle
// android/app/build.gradle
// Claude Code에게: 이 내용을 추가하세요

android {
    ...
    
    signingConfigs {
        release {
            storeFile file('hikingmate.keystore')
            storePassword 'YOUR_PASSWORD'
            keyAlias 'hikingmate'
            keyPassword 'YOUR_PASSWORD'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

```bash
# 2. AAB 빌드
cd android
./gradlew bundleRelease

# 빌드 완료:
# android/app/build/outputs/bundle/release/app-release.aab

# 3. Google Play Console에 업로드
# - 프로덕션 > 새 버전 만들기
# - AAB 파일 업로드
# - 버전 이름: 1.0.0
# - 버전 코드: 1
# - 출시 노트 작성

# 4. 검토 및 출시
# - '프로덕션으로 출시' 클릭
# - 심사 대기 (1-3일)
```

### 8.8 내부 테스트 트랙 (권장)

```bash
# 정식 출시 전 내부 테스트 권장

# 1. Play Console > 테스트 > 내부 테스트
# 2. 새 버전 만들기
# 3. AAB 업로드
# 4. 테스터 이메일 추가
# 5. 출시

# 테스터들이:
# - Play Store에서 다운로드
# - 모든 기능 테스트
# - 피드백 제공

# 문제 없으면:
# - 프로덕션 트랙으로 승격
```

---

## 📝 Step 9: 코드 재사용 전략

### 9.1 플랫폼 감지 패턴

```typescript
// 모든 네이티브 기능 사용 시 이 패턴 적용

import { Capacitor } from '@capacitor/core';

export function useFeature() {
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    // 네이티브 API 사용
    return useNativeFeature();
  } else {
    // 웹 API 사용
    return useWebFeature();
  }
}
```

### 9.2 환경별 설정

```typescript
// lib/config.ts

import { Capacitor } from '@capacitor/core';

export const config = {
  isNative: Capacitor.isNativePlatform(),
  platform: Capacitor.getPlatform(), // 'web' | 'ios' | 'android'
  
  features: {
    backgroundTracking: Capacitor.isNativePlatform(),
    pushNotifications: Capacitor.isNativePlatform(),
    haptics: Capacitor.isNativePlatform()
  },
  
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.hikingmate.app'
  }
};
```

### 9.3 점진적 기능 활성화

```typescript
// components/FeatureGate.tsx

import { usePlatform } from '@/lib/hooks/usePlatform';

export function FeatureGate({ 
  feature, 
  children,
  fallback 
}: {
  feature: 'background-tracking' | 'push-notifications';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isNative } = usePlatform();
  
  const featureAvailable = {
    'background-tracking': isNative,
    'push-notifications': isNative,
  }[feature];
  
  if (featureAvailable) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

// 사용 예시:
<FeatureGate 
  feature="background-tracking"
  fallback={
    <div className="bg-yellow-100 p-4 rounded">
      ⚠️ 백그라운드 추적은 앱에서만 가능합니다.
      <a href="/download" className="text-blue-600">앱 다운로드</a>
    </div>
  }
>
  <BackgroundTrackingComponent />
</FeatureGate>
```

---

## 📝 Step 10: 유지보수 및 업데이트

### 10.1 버전 관리 전략

```bash
# 버전 번호 규칙: MAJOR.MINOR.PATCH

# MAJOR (1.0.0 → 2.0.0)
- 대규모 기능 추가
- API 변경
- UI/UX 전면 개편

# MINOR (1.0.0 → 1.1.0)
- 새로운 기능 추가
- 기존 기능 개선

# PATCH (1.0.0 → 1.0.1)
- 버그 수정
- 작은 개선사항
```

### 10.2 업데이트 프로세스

```bash
# 1. 코드 수정
# 2. 버전 번호 증가

# iOS:
# Xcode > General > Version / Build

# Android:
# android/app/build.gradle
android {
    defaultConfig {
        versionCode 2    // 정수, 계속 증가
        versionName "1.0.1"  // 문자열, 사용자에게 표시
    }
}

# 3. 빌드 및 테스트
npm run build
npx cap sync
# Xcode / Android Studio에서 테스트

# 4. 배포
# iOS: Archive → Upload
# Android: ./gradlew bundleRelease → Upload

# 5. 출시 노트 작성
"버전 1.0.1 업데이트 내용:
- GPS 추적 정확도 개선
- 배터리 소모 20% 감소
- 경로 이탈 알림 버그 수정"
```

### 10.3 Hot Update (선택)

```bash
# Capacitor Live Updates로 웹 부분 즉시 업데이트
# (네이티브 코드 변경 없이)

# 장점:
✅ 앱 스토어 심사 불필요
✅ 즉시 업데이트 반영
✅ A/B 테스트 가능

# 단점:
⚠️ 유료 서비스
⚠️ 네이티브 코드 변경 불가

# 추천:
Phase 3 이후, DAU 5,000명 이상 시 고려
```

---

## ✅ 최종 체크리스트

### 개발 환경
- [ ] Xcode 설치 및 설정 (macOS)
- [ ] Android Studio 설치 및 설정
- [ ] Apple Developer 계정 가입 ($129/년)
- [ ] Google Play Console 계정 가입 ($25)

### Capacitor 설정
- [ ] Capacitor 설치 및 초기화
- [ ] iOS 플랫폼 추가
- [ ] Android 플랫폼 추가
- [ ] Next.js Static Export 설정
- [ ] capacitor.config.ts 설정

### 네이티브 플러그인
- [ ] Background Geolocation 설치 및 설정
- [ ] Local Notifications 설치 및 설정
- [ ] Push Notifications 설치 및 설정 (FCM)
- [ ] 기타 플러그인 설치 (Camera, Storage 등)

### 권한 설정
- [ ] iOS Info.plist 권한 설명 추가
- [ ] Android AndroidManifest.xml 권한 추가
- [ ] 백그라운드 모드 설정

### 코드 작성
- [ ] 플랫폼 감지 훅 구현
- [ ] 네이티브 API 래퍼 작성
- [ ] 조건부 렌더링 구현
- [ ] 에러 핸들링

### 아이콘 및 스플래시
- [ ] 1024x1024 앱 아이콘 준비
- [ ] iOS 아이콘 세트 생성 및 적용
- [ ] Android 아이콘 세트 생성 및 적용
- [ ] 스플래시 스크린 설정

### 빌드 및 테스트
- [ ] iOS 시뮬레이터 테스트
- [ ] Android 에뮬레이터 테스트
- [ ] iOS 실기기 테스트
- [ ] Android 실기기 테스트
- [ ] 백그라운드 위치 추적 테스트
- [ ] 알림 기능 테스트

### iOS App Store
- [ ] App Store Connect 앱 등록
- [ ] 앱 메타데이터 작성
- [ ] 스크린샷 준비 (6.7", 6.5")
- [ ] 심사 정보 작성 (데모 계정)
- [ ] Archive 생성 및 업로드
- [ ] 심사 제출

### Android Google Play
- [ ] Play Console 앱 등록
- [ ] 앱 메타데이터 작성
- [ ] 그래픽 에셋 준비
- [ ] 콘텐츠 등급 완료
- [ ] 키스토어 생성 및 보관
- [ ] AAB 빌드 및 업로드
- [ ] 심사 제출

### 배포 후
- [ ] 앱 스토어 승인 확인
- [ ] 초기 사용자 피드백 수집
- [ ] 크래시 모니터링 설정
- [ ] 업데이트 프로세스 문서화

---

## 🎉 완료!

축하합니다! 이제 PWA를 네이티브 앱으로 마이그레이션했습니다.

### 다음 단계

1. **모니터링 설정**
   - Firebase Crashlytics
   - App Store Connect Analytics
   - Google Play Console Vitals

2. **사용자 피드백**
   - 인앱 피드백 기능
   - 리뷰 관리
   - 기능 개선

3. **마케팅**
   - App Store 최적화 (ASO)
   - 키워드 최적화
   - 스크린샷 A/B 테스트

4. **계속 개발**
   - 사용자 요청 기능 추가
   - 성능 최적화
   - 버그 수정

---

## 📚 추가 리소스

### 공식 문서
- Capacitor: https://capacitorjs.com/docs
- iOS Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Android Design Guidelines: https://developer.android.com/design

### 커뮤니티
- Capacitor Discord: https://discord.com/invite/UPYYRhtyzp
- Ionic Forum: https://forum.ionicframework.com/

### 도구
- App Icon Generator: https://icon.kitchen
- Screenshot Framer: https://screenshots.pro
- ASO Tool: https://www.appannie.com

---

## 💰 예상 비용 정리

```bash
초기 비용:
- Apple Developer: $129/년
- Google Play: $25 (1회)
총: $154 (₩약 20만원)

월간 운영비 (기존과 동일):
- Vercel: $0
- Supabase: $25
- Firebase: $0 (무료 한도 내)
총: $25/월

추가 비용 없음!
```

---

## 🚨 중요 주의사항

1. **키스토어 백업 필수**
   - Android 키스토어 파일 안전하게 보관
   - 분실 시 앱 업데이트 불가능
   - 클라우드 백업 권장

2. **개발자 계정 유지**
   - Apple Developer: 매년 갱신 필요
   - 만료 시 앱 다운로드 불가

3. **심사 거절 대비**
   - 첫 출시 시 거절 가능성 있음
   - 수정 후 재제출 가능
   - 평균 2-3회 시도 후 승인

4. **사용자 데이터 보호**
   - GDPR 준수
   - 개인정보처리방침 필수
   - 사용자 동의 명확히

---

이제 Claude Code에게 이 가이드를 전달하면 단계별로 따라 구현할 수 있습니다! 🚀
