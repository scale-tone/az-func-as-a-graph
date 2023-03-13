const ncp = require('ncp').ncp;
const rimraf = require("rimraf");

const buildFolder = './build';
const outputFolder = '../vscode-web-ext/HtmlStatics';

rimraf.sync(`${outputFolder}/static/`);
ncp(`${buildFolder}/static/`, `${outputFolder}/static/`);
ncp(`${buildFolder}/index.html`, `${outputFolder}/index.html`);