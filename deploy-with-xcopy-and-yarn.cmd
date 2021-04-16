:: ----------------------
:: Custom Deployment Script
:: Fetches npm packages into a temp folder (which is much faster), then zips it and mounts that zip file.
:: ----------------------

@echo off

IF "%WEBSITE_RUN_FROM_PACKAGE%" NEQ "1" (
    echo For this script to work you need to enable Run from Package (set WEBSITE_RUN_FROM_PACKAGE to '1')
    exit /b 1
)

call npm install yarn -g --silent
IF %errorlevel% NEQ 0 exit /b %ERRORLEVEL%

SET MY_BUILD_TEMP_FOLDER=%TMP%\D72793BA373B4EBB80AEC9E6CF1E0C0E

mkdir %MY_BUILD_TEMP_FOLDER%
xcopy %DEPLOYMENT_SOURCE% %MY_BUILD_TEMP_FOLDER% /S /H /Y
IF %errorlevel% NEQ 0 exit /b %ERRORLEVEL%

cd %MY_BUILD_TEMP_FOLDER%
call yarn
IF %errorlevel% NEQ 0 exit /b %ERRORLEVEL%

mkdir d:\home\data\SitePackages
echo package.zip > d:\home\data\SitePackages\packagename.txt
del d:\home\data\SitePackages\package.zip

powershell "$ProgressPreference = 'SilentlyContinue'; Compress-Archive %MY_BUILD_TEMP_FOLDER%\* d:\home\data\SitePackages\package.zip"
IF %errorlevel% NEQ 0 exit /b %ERRORLEVEL%