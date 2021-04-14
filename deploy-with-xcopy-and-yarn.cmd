echo kkk xcopying

xcopy %DEPLOYMENT_SOURCE% %DEPLOYMENT_TARGET% /S /H /Y

echo kkk doing ls

ls

echo kkk going to %DEPLOYMENT_TARGET%

cd %DEPLOYMENT_TARGET%

echo kkk doing ls

ls

echo kkk doing yarn

yarn
