import { Context, HttpRequest } from "@azure/functions"
import * as rimraf from 'rimraf';

import { traverseFunctionProject } from './traverseFunctionProject';

// Main function
export default async function (context: Context, req: HttpRequest): Promise<void> {

    var tempFolders = [];
    try {

        const result = await traverseFunctionProject(req.body as string, context.log);
        tempFolders = result.tempFolders;
        context.res = { body: result.functions };
        
    } catch (err) {

        context.log(`>>> Failed: ${err}`);

        context.res = {
            status: 500,
            body: err.message
        };

    } finally {

        for (const tempFolder of tempFolders) {
            context.log(`>>> Asynchronously removing ${tempFolder}`);
            setTimeout(() => { rimraf.sync(tempFolder) }, 0);
        }
    }
};