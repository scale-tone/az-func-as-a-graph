const fs = require('fs');
const path = require('path');

const { renderDiagramWithCli } = require('./cli/dist/cli/renderDiagramWithCli');

const projectFolder = process.argv[2];
const outputFile = process.argv[3];
const settingsFile = process.argv[4];

var settings = {};

if (!!settingsFile) {

    if (['.htm', '.html'].includes(path.extname(settingsFile).toLowerCase())) {

        settings = { htmlTemplateFile: settingsFile };

    } else {
        
        settings = JSON.parse(fs.readFileSync(settingsFile, { encoding: 'utf8' }));
    }
}

renderDiagramWithCli(projectFolder, outputFile, settings);