import { Context } from "@azure/functions"

const path = require('path');
const fs = require('fs');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const fileExistsAsync = util.promisify(fs.exists);

// Root folder where all the statics are copied to
const wwwroot = './ui/build';

// Serves statics for the client UI
export default async function (context: Context): Promise<void> {

    const p1 = context.bindingData.p1;
    const p2 = context.bindingData.p2;
    const p3 = !!context.bindingData.p3 ? path.basename(context.bindingData.p3) : '';

    const fileMap = {
        'static/css': {
            fileName: `${wwwroot}/static/css/${p3}`,
            contentType: 'text/css; charset=utf-8'
        },
        'static/js': {
            fileName: `${wwwroot}/static/js/${p3}`,
            contentType: 'application/javascript; charset=UTF-8'
        },
        'static/icons': {
            fileName: `${wwwroot}/static/icons/${p3}`,
            contentType: 'image/svg+xml; charset=UTF-8'
        },
        'favicon.ico/undefined': {
            fileName: `${wwwroot}/favicon.ico`,
            contentType: 'image/x-icon'
        }
    };

    const mapEntry = fileMap[`${p1}/${p2}`];

    if (!!mapEntry) {

        if (await fileExistsAsync(mapEntry.fileName)) {

            context.res = {
                body: await readFileAsync(mapEntry.fileName),
                headers: { 'Content-Type': mapEntry.contentType }
            };

        } else {

            context.res = { status: 404 };
        }

    } else {

        // Returning index.html by default, to support client routing
        context.res = {
            body: await readFileAsync(`${wwwroot}/index.html`),
            headers: { 'Content-Type': 'text/html; charset=UTF-8' }
        };
    }
};