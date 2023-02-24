import * as fs from 'fs';
import * as path from 'path';

import { FunctionsMap } from '../ui/src/shared/FunctionsMap';
import {
    getCodeInBrackets, BindingsParser,
    posToLineNr, ExcludedFolders, TraversalRegexes, findFileRecursivelyAsync, FunctionProjectKind
} from './traverseFunctionProjectUtils';

export async function traverseProjectCode(projectKind: FunctionProjectKind, projectFolder: string): Promise<FunctionsMap> {

    let result: any = {};

    let fileNameRegex: RegExp;
    let funcAttributeRegex: RegExp;
    let funcNamePosIndex: number;

    switch (projectKind) {
        case 'cSharp':
            fileNameRegex = new RegExp('.+\\.cs$', 'i');
            funcAttributeRegex = BindingsParser.functionAttributeRegex;
            funcNamePosIndex = 3;
            break;
        case 'fSharp':
            fileNameRegex = new RegExp('.+\\.fs$', 'i');
            funcAttributeRegex = BindingsParser.fSharpFunctionAttributeRegex;
            funcNamePosIndex = 2;
            break;
        case 'java':
            fileNameRegex = new RegExp('.+\\.java$', 'i');
            funcAttributeRegex = BindingsParser.javaFunctionAttributeRegex;
            funcNamePosIndex = 1;
            break;
        default:
            return;
    }
    
    for await (const func of findFunctionsRecursivelyAsync(projectFolder, fileNameRegex, funcAttributeRegex, funcNamePosIndex)) {

        const bindings = BindingsParser.tryExtractBindings(func.declarationCode);
   
        if (projectKind === 'cSharp') {
            
            // Also trying to extract multiple output bindings
            bindings.push(...await extractOutputBindings(projectFolder, func.declarationCode, fileNameRegex));
        }

        result[func.functionName] = {

            filePath: func.filePath,
            pos: func.pos,
            lineNr: func.lineNr,

            bindings: [...bindings]
        };
    }

    return result;
}

async function extractOutputBindings(projectFolder: string, functionCode: string, fileNameRegex: RegExp): Promise<{ type: string, direction: string }[]> {
    
    const returnTypeMatch = BindingsParser.functionReturnTypeRegex.exec(functionCode);
    if (!returnTypeMatch) {
        return [];
    }

    const returnTypeName = removeNamespace(returnTypeMatch[3]);
    if (!returnTypeName) {
        return [];
    }

    const returnTypeDefinition = await findFileRecursivelyAsync(projectFolder, fileNameRegex, true, TraversalRegexes.getClassDefinitionRegex(returnTypeName));
    if (!returnTypeDefinition) {
        return [];
    }

    const classBody = getCodeInBrackets(returnTypeDefinition.code!, (returnTypeDefinition.pos ?? 0) + (returnTypeDefinition.length ?? 0), '{', '}');
    if (!classBody.code) {
        return [];
    }

    return BindingsParser.tryExtractBindings(classBody.code);
}

async function* findFunctionsRecursivelyAsync(folder: string, fileNameRegex: RegExp, functionAttributeRegex: RegExp, functionNamePosInRegex: number): AsyncGenerator<any> {

    for (const dirEnt of await fs.promises.readdir(folder, { withFileTypes: true })) {

        var fullPath = path.join(folder, dirEnt.name);

        if (dirEnt.isDirectory()) {

            if (ExcludedFolders.includes(dirEnt.name.toLowerCase())) {
                continue;
            }

            for await (const file of findFunctionsRecursivelyAsync(fullPath, fileNameRegex, functionAttributeRegex, functionNamePosInRegex)) {

                yield file;
            }

        } else if (!!fileNameRegex.exec(dirEnt.name)) {

            const code = await fs.promises.readFile(fullPath, { encoding: 'utf8' });

            var match: RegExpExecArray | null;
            while (!!(match = functionAttributeRegex.exec(code))) {

                let functionName = cleanupFunctionName(match[functionNamePosInRegex]);

                const functionAttributeEndPos = match.index + match[0].length;

                const body = getCodeInBrackets(code, functionAttributeEndPos, '{', '}', '\n');

                if (body.openBracketPos >= 0 && !!body.code) {

                    yield {
                        functionName,
                        filePath: fullPath,
                        pos: match.index,
                        lineNr: posToLineNr(code, match.index),
                        declarationCode: body.code.substring(0, body.openBracketPos),
                        bodyCode: body.code.substring(body.openBracketPos)
                    };

                } else {

                    // Returning the rest of the file

                    yield {
                        functionName,
                        filePath: fullPath,
                        pos: match.index,
                        lineNr: posToLineNr(code, match.index),

                        declarationCode: code.substring(functionAttributeEndPos),
                        bodyCode: code.substring(functionAttributeEndPos)
                    };

                    break;
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
    if (dotPos >= 0) {
        name = name.substring(dotPos + 1);
    }

    return name.trim();
}

function cleanupFunctionName(name: string): string {

    if (!name) {
        return name;
    }

    const nameofMatch = new RegExp(`nameof\\s*\\(\\s*([\\w\\.]+)\\s*\\)`).exec(name);
    if (!!nameofMatch) {

        return removeNamespace(nameofMatch[1]);
    }

    name = name.trim();

    if (name.startsWith('"')) {
        return name.replace(/^"/, '').replace(/"$/, '');
    }

    return removeNamespace(name);
}
