:: ----------------------
:: Custom Deployment Script
:: Fetches npm packages into a temp folder (which is much faster), then zips it and mounts that zip file.
:: ----------------------

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