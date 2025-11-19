@echo off
echo ====================================
echo Python 3.11 가상환경 설정
echo ====================================

REM Python 버전 확인
python --version | findstr /C:"3.11"
if errorlevel 1 (
    echo.
    echo [ERROR] Python 3.11이 설치되어 있지 않습니다.
    echo Python 3.11을 먼저 설치해주세요: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo.
echo [1/3] Python 3.11 확인 완료
echo.

REM 가상환경 생성
if exist venv (
    echo 기존 가상환경이 있습니다. 삭제하고 새로 생성하시겠습니까? (Y/N)
    set /p confirm=
    if /i "%confirm%"=="Y" (
        echo 기존 가상환경 삭제 중...
        rmdir /s /q venv
    ) else (
        echo 설치를 취소합니다.
        pause
        exit /b 0
    )
)

echo.
echo [2/3] 가상환경 생성 중...
python -m venv venv

echo.
echo [3/3] 패키지 설치 중...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ====================================
echo 설치 완료!
echo ====================================
echo.
echo 가상환경 활성화 방법:
echo   venv\Scripts\activate
echo.
echo 가상환경 비활성화 방법:
echo   deactivate
echo.
pause
