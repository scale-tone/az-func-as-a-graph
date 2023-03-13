const ncp = require('ncp').ncp;

const files = ['fileSystemWrapperBase.ts', 'functionProjectParser.ts', 'FunctionsMap.ts', 'traverseFunctionProjectUtils.ts'];

for (const file of files) {
    
    ncp(`../core/${file}`, `./src/web/core/${file}`);
}