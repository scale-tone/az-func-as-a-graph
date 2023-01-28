import * as fs from 'fs';
import * as path from 'path';

import { FunctionsMap } from '../ui/src/shared/FunctionsMap';
import {
    getCodeInBrackets, DotNetBindingsParser,
    posToLineNr, ExcludedFolders, TraversalRegexes, findFileRecursivelyAsync
} from './traverseFunctionProjectUtils';


// Tries to parse code of a .NET Isolated function and extract bindings from there
export async function traverseDotNetIsolatedProject(projectFolder: string): Promise<FunctionsMap> {

    let result = {};

    for await (const func of findFunctionsRecursivelyAsync(projectFolder)) {

        const bindings = DotNetBindingsParser.tryExtractBindings(func.declarationCode);
   
        // Also trying to extract multiple output bindings
        const outputBindings = await extractOutputBindings(projectFolder, func.declarationCode);

        result[func.functionName] = {

            filePath: func.filePath,
            pos: func.pos,
            lineNr: func.lineNr,

            bindings: [...bindings, ...outputBindings]
        };
    }

    return result;
}

async function extractOutputBindings(projectFolder: string, functionCode: string): Promise<{ type: string, direction: string }[]> {
    
    const returnTypeMatch = DotNetBindingsParser.functionReturnTypeRegex.exec(functionCode);
    if (!returnTypeMatch) {
        return [];
    }

    const returnTypeName = removeNamespace(returnTypeMatch[3]);
    if (!returnTypeName) {
        return [];
    }

    const returnTypeDefinition = await findFileRecursivelyAsync(projectFolder, '.+\\.cs$', true, TraversalRegexes.getClassDefinitionRegex(returnTypeName));
    if (!returnTypeDefinition) {
        return [];
    }

    const classBody = getCodeInBrackets(returnTypeDefinition.code, returnTypeDefinition.pos + returnTypeDefinition.length, '{', '}');
    if (!classBody.code) {
        return [];
    }

    return DotNetBindingsParser.tryExtractBindings(classBody.code);
}

async function* findFunctionsRecursivelyAsync(folder: string) {

    for (const dirEnt of await fs.promises.readdir(folder, { withFileTypes: true })) {

        var fullPath = path.join(folder, dirEnt.name);

        if (dirEnt.isDirectory()) {

            if (ExcludedFolders.includes(dirEnt.name.toLowerCase())) {
                continue;
            }

            for await (const file of findFunctionsRecursivelyAsync(fullPath)) {

                yield file;
            }

        } else if (!!TraversalRegexes.cSharpFileNameRegex.exec(dirEnt.name)) {

            const code = await fs.promises.readFile(fullPath, { encoding: 'utf8' });

            var match: RegExpExecArray | null;
            while (!!(match = DotNetBindingsParser.functionAttributeRegex.exec(code))) {

                let functionName = removeNamespace(match[3]);

                const body = getCodeInBrackets(code, match.index + match[0].length, '{', '}', ' \n');

                if (body.openBracketPos >= 0 && !!body.code) {

                    yield {
                        functionName,
                        filePath: fullPath,
                        pos: match.index,
                        lineNr: posToLineNr(code, match.index),
                        declarationCode: body.code.substring(0, body.openBracketPos),
                        bodyCode: body.code.substring(body.openBracketPos)
                    };
                }
            }        
        }
    }
}

function removeNamespace(name: string): string {

    if (!name) {
        return name;
    }

    const dotPos = name.lastIndexOf('.');
    return dotPos >= 0 ? name.substring(dotPos + 1) : name;
}
