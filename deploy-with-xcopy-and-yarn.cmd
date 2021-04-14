xcopy %DEPLOYMENT_SOURCE% %DEPLOYMENT_TARGET% /S /H /Y
npm i -g yarn
echo >>>> going to %DEPLOYMENT_TARGET%
cd %DEPLOYMENT_TARGET%
echo >>>> doing ls
ls
echo >>>> doing yarn
yarn
