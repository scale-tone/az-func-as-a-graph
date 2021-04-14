call npm install yarn -g --silent
xcopy %DEPLOYMENT_SOURCE% %DEPLOYMENT_TARGET% /S /H /Y
cd %DEPLOYMENT_TARGET%
yarn
