@echo off
echo ====================================
echo OpenVillage Desktop 打包工具
echo ====================================
echo.

echo [1/3] 清理旧的打包文件...
if exist release rmdir /s /q release
if exist dist rmdir /s /q dist

echo [2/3] 构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo 构建失败！
    pause
    exit /b 1
)

echo [3/3] 打包Windows应用...
call npm run dist:dir
if %errorlevel% neq 0 (
    echo 打包失败！
    pause
    exit /b 1
)

echo.
echo ====================================
echo 打包完成！
echo ====================================
echo.
echo 打包文件位置: release\OpenVillage Desktop-win32-x64\
echo 主程序: release\OpenVillage Desktop-win32-x64\OpenVillage Desktop.exe
echo.
echo 按任意键打开打包目录...
pause >nul
explorer release
