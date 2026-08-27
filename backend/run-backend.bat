@echo off
set JAVA_HOME=C:\Users\95000033\Downloads\DPR_Portal-main\DPR_Portal-main\.tools\jdk-21.0.3+9
set PATH=%JAVA_HOME%\bin;C:\Users\95000033\Downloads\DPR_Portal-main\DPR_Portal-main\.tools\apache-maven-3.9.6\bin;%PATH%
echo Starting CMPDI DAMS Spring Boot Backend...
echo JAVA_HOME = %JAVA_HOME%
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx512m"
