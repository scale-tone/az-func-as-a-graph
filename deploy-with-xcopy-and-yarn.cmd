:: ----------------------
:: Custom Deployment Script
:: Fetches npm packages inside a temp folder (which is much faster), then zips it and mounts that zip file.
:: ----------------------

@IF "%WEBSITE_RUN_FROM_PACKAGE%" NEQ "1" (
    echo For this script to work you need to enable Run from Package, aka set WEBSITE_RUN_FROM_PACKAGE=1 
    exit /b 1
)

SET MY_BUILD_TEMP_FOLDER=%TMP%\D72793BA373B4EBB80AEC9E6CF1E0C0E

mkdir %MY_BUILD_TEMP_FOLDER%
xcopy %DEPLOYMENT_SOURCE% %MY_BUILD_TEMP_FOLDER% /S /H /Y
IF %errorlevel% NEQ 0 goto end

cd %MY_BUILD_TEMP_FOLDER%

call npm install yarn --silent
SET PATH=%PATH%;%MY_BUILD_TEMP_FOLDER%\node_modules\.bin\yarn
call yarn
IF %errorlevel% NEQ 0 goto end

mkdir d:\home\data\SitePackages
echo package.zip > d:\home\data\SitePackages\packagename.txt
del /Q d:\home\data\SitePackages\package.zip

powershell "$ProgressPreference = 'SilentlyContinue'; Compress-Archive %MY_BUILD_TEMP_FOLDER%\* d:\home\data\SitePackages\package.zip"

:end
rmdir /S /Q %MY_BUILD_TEMP_FOLDER%
exit /b %ERRORLEVEL%