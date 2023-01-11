import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { exec } from 'child_process';
const execAsync = util.promisify(exec);

import { FunctionsMap, ProxiesMap, TraverseFunctionResult } from '../ui/src/shared/FunctionsMap';
import {
    getCodeInBrackets, TraversalRegexes, DotNetBindingsParser,
    isDotNetProjectAsync, isDotNetIsolatedProjectAsync, posToLineNr, cloneFromGitHub, ExcludedFolders
} from './traverseFunctionProjectUtils';


// Tries to parse code of a .NET Isolated function and extract bindings from there
export async function traverseDotNetIsolatedProject(projectFolder: string): Promise<FunctionsMap> {

    for await (const csFile of findFilesRecursivelyAsync(projectFolder, new RegExp('.+\\.cs$', 'i'), DotNetBindingsParser.functionAttributeRegex)) {
    
        console.log(csFile.code);
    }

    return {};
}

async function* findFilesRecursivelyAsync(folder: string, fileNameRegex: RegExp, pattern: RegExp) {

    for (const dirEnt of await fs.promises.readdir(folder, { withFileTypes: true })) {

        var fullPath = path.join(folder, dirEnt.name);

        if (dirEnt.isDirectory()) {

            if (ExcludedFolders.includes(dirEnt.name.toLowerCase())) {
                continue;
            }

            for await (const file of findFilesRecursivelyAsync(fullPath, fileNameRegex, pattern)) {

                yield file;
            }

        } else if (!!fileNameRegex.exec(dirEnt.name)) {

            const code = await fs.promises.readFile(fullPath, { encoding: 'utf8' });
            const match = pattern.exec(code);

            if (!!match) {

                yield {
                    filePath: fullPath,
                    code,
                    pos: match.index,
                    length: match[0].length
                };
            }
        }
    }
}

