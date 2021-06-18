// collects all azure icons and saves them into a single all-azure-icons.svg file

const fs = require('fs');
const path = require('path');

const iconFolder = path.join('.', 'build', 'static', 'icons');

var iconsSvg = '';
const azIconIdPrefix = 'az-icon-';

for (const iconFileName of fs.readdirSync(iconFolder)) {
    const iconFilePath = path.join(iconFolder, iconFileName);

    var iconSvg = fs.readFileSync(iconFilePath, { encoding: 'utf8' });

    // removing xml prefix
    iconSvg = iconSvg.replace(/<\?xml .+\?>/, '');

    // adding/replacing id attribute
    const idString = ` id="${azIconIdPrefix}${path.basename(iconFilePath, '.svg')}"`;

    const match = /\s+id=".+"/.exec(iconSvg);
    if (!!match) {

        iconSvg = iconSvg.substr(0, match.index) + idString + iconSvg.substr(match.index + match[0].length);

    } else {

        iconSvg = iconSvg.replace(/<svg\s+/, `<svg id="${azIconIdPrefix}${path.basename(iconFilePath, '.svg')}" `);
    }

    iconsSvg += iconSvg + '\n';
}

fs.writeFileSync(path.join(iconFolder, 'all-azure-icons.svg'), `<defs>${iconsSvg}</defs>`);