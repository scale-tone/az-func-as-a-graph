const fs = require('fs');

const entities = {};

const foldersToExclude = ['./node_modules', './ui', './__test', './dist'];
// Grabs all classes derived from DurableEntity and puts them into entities
function collectEntitiesInFolder(folderName) {

    for (const fileName of fs.readdirSync(folderName)) {

        const fullPath = folderName + '/' + fileName;

        if (fs.lstatSync(fullPath).isDirectory() && (!foldersToExclude.includes(fullPath))) {
            collectEntitiesInFolder(fullPath);
            continue;
        }

        if (fileName.endsWith('.ts')) {

            const code = fs.readFileSync(fullPath, { encoding: 'utf8' });

            const match = /class (\w+) extends DurableEntity</i.exec(code);
            if (!!match) {

                entities[match[1]] = fullPath;
            }
        }
    }
}

collectEntitiesInFolder('.');

for (const entityName in entities) {

    var importFileName = entities[entityName];
    importFileName = '.' + importFileName.substr(0, importFileName.length - 3);

    if (!fs.existsSync(entityName)) {
        fs.mkdirSync(entityName);
    }

    const indexTsFileName = entityName + '/index.ts';
    if (fs.existsSync(indexTsFileName)) {
        // TODO: validate file contents
        console.log(`#durable-mvc: ${indexTsFileName} already exists - skipping`);
    } else {

        console.log(`#durable-mvc: generating ${indexTsFileName}`);

        const code = `
import * as DurableFunctions from "durable-functions"
import { ${entityName} } from '${importFileName}';
export default DurableFunctions.entity((ctx) => new ${entityName}(ctx).handleSignal());
        `;

        fs.writeFileSync(indexTsFileName, code);
    }

    const functionJsonFileName = entityName + '/function.json';
    if (fs.existsSync(functionJsonFileName)) {
        // TODO: validate file contents
        console.log(`#durable-mvc: ${functionJsonFileName} already exists - skipping`);
    } else {

        console.log(`#durable-mvc: generating ${functionJsonFileName}`);

        const functionJson = {
            bindings: [
                {
                    name: 'context',
                    type: 'entityTrigger',
                    direction: 'in'
                },
                {
                    type: 'signalR',
                    name: 'signalRMessages',
                    hubName: '%AzureSignalRHubName%',
                    connectionStringSetting: 'AzureSignalRConnectionString',
                    direction:'out'
                }
            ],
            disabled: false,
            scriptFile: `../dist/${entityName}/index.js`
        };

        fs.writeFileSync(functionJsonFileName, JSON.stringify(functionJson, null, 4));
    }
}