"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require('path');
const fs = require('fs');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const fileExistsAsync = util.promisify(fs.exists);
// Root folder where all the statics are copied to
const wwwroot = './ui/build';
// Serves statics for the client UI
function default_1(context) {
    return __awaiter(this, void 0, void 0, function* () {
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
            'logo.svg/undefined': {
                fileName: `${wwwroot}/logo.svg`,
                contentType: 'image/svg+xml; charset=UTF-8'
            }
        };
        const mapEntry = fileMap[`${p1}/${p2}`];
        if (!!mapEntry) {
            if (yield fileExistsAsync(mapEntry.fileName)) {
                context.res = {
                    body: yield readFileAsync(mapEntry.fileName),
                    headers: { 'Content-Type': mapEntry.contentType }
                };
            }
            else {
                context.res = { status: 404 };
            }
        }
        else {
            // Returning index.html by default, to support client routing
            context.res = {
                body: yield readFileAsync(`${wwwroot}/index.html`),
                headers: { 'Content-Type': 'text/html; charset=UTF-8' }
            };
        }
    });
}
exports.default = default_1;
;
//# sourceMappingURL=index.js.map