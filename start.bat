@echo off
set "NODE_DIR=C:\Users\95000033\Downloads\DPR_Portal-main\DPR_Portal-main\.tools\node-v20.12.2-win-x64"
set "JAVA_HOME=C:\Users\95000033\Downloads\DPR_Portal-main\DPR_Portal-main\.tools\jdk-21.0.3+9"
set "MVN_DIR=C:\Users\95000033\Downloads\DPR_Portal-main\DPR_Portal-main\.tools\apache-maven-3.9.6\bin"

set "PATH=%JAVA_HOME%\bin;%MVN_DIR%;%NODE_DIR%;%PATH%"

echo ===================================================
echo  CMPDI DAMS - Starting Application
echo ===================================================
echo.

echo [1/2] Starting Spring Boot Backend on port 8080...
start "CMPDI Backend" cmd /k "cd /d "%~dp0backend" && mvn spring-boot:run -Dspring-boot.run.jvmArguments=-Xmx512m"

echo Waiting for backend to start...
ping -n 5 127.0.0.1 > NUL

echo [2/2] Starting React Frontend on port 3000...
start "CMPDI Frontend" cmd /k "cd /d "%~dp0frontend" && node node_modules\vite\bin\vite.js"

echo.
echo ===================================================
echo  Backend:   http://localhost:8080
echo  Frontend:  http://localhost:3000
echo  H2 DB:     http://localhost:8080/h2-console
echo ===================================================
echo.


