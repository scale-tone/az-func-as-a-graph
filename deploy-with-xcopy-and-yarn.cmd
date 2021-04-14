call npm install yarn -g --silent

SET MY_BUILD_TEMP_FOLDER=%TMP%\D72793BA373B4EBB80AEC9E6CF1E0C0E

mkdir %MY_BUILD_TEMP_FOLDER%
xcopy %DEPLOYMENT_SOURCE% %MY_BUILD_TEMP_FOLDER% /S /H /Y
cd %MY_BUILD_TEMP_FOLDER%
call yarn

mkdir d:\home\data\SitePackages
echo package.zip > d:\home\data\SitePackages\packagename.txt

echo kkkk compressing %MY_BUILD_TEMP_FOLDER% to d:\home\data\SitePackages\package.zip...

powershell "$ProgressPreference = 'SilentlyContinue'; Compress-Archive %MY_BUILD_TEMP_FOLDER%\* d:\home\data\SitePackages\package.zip"