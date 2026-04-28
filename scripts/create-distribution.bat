@echo off
echo ====================================
echo 创建分发文件
echo ====================================
echo.

set VERSION=0.1.0
set APP_NAME=OpenVillage Desktop
set SOURCE_DIR=release\OpenVillage Desktop-win32-x64
set OUTPUT_FILE=release\OpenVillage-Desktop-%VERSION%-win64.zip

echo 源目录: %SOURCE_DIR%
echo 输出文件: %OUTPUT_FILE%
echo.

if not exist "%SOURCE_DIR%" (
    echo 错误：应用目录不存在！
    echo 请先运行 npm run dist:dir 进行打包
    pause
    exit /b 1
)

echo 正在创建zip文件...
powershell -Command "Compress-Archive -Path '%SOURCE_DIR%\*' -DestinationPath '%OUTPUT_FILE%' -Force"

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo 分发文件创建成功！
    echo ====================================
    echo.
    echo 文件位置: %OUTPUT_FILE%
    echo 文件大小:
    dir "%OUTPUT_FILE%" | find "%OUTPUT_FILE%"
    echo.
    echo 用户使用说明：
    echo 1. 将 %OUTPUT_FILE% 分发给用户
    echo 2. 用户解压zip文件
    echo 3. 运行 OpenVillage Desktop.exe
    echo.
) else (
    echo 创建zip文件失败！
    echo 请确保PowerShell可用
    pause
    exit /b 1
)

pause
