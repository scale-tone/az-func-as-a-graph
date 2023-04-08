import { TraverseFunctionResult } from "./FunctionsMap";
import { FileSystemWrapperBase } from './fileSystemWrapperBase';

import { FunctionProjectParserBase } from './functionProjectParserBase';
import { FunctionProjectScriptParser } from './functionProjectScriptParser';
import { CSharpFunctionProjectParser } from './cSharpFunctionProjectParser';
import { FSharpFunctionProjectParser } from './fSharpFunctionProjectParser';
import { JavaFunctionProjectParser } from './javaFunctionProjectParser';
import { PowershellFunctionProjectParser } from './powershellFunctionProjectParser';
import { PythonV2FunctionProjectParser } from './pythonV2FunctionProjectParser';

// Parses Azure Functions projects to produce Functions map (list of all Functions, their bindings and connections to other Functions)
export abstract class FunctionProjectParser {

    // Collects all function.json files in a Functions project. Also tries to supplement them with bindings
    // extracted from code (if the project is .Net or Java). Also parses and organizes orchestrators/activities 
    // (if the project uses Durable Functions)
    public static async parseFunctions(projectFolder: string, fileSystemWrapper: FileSystemWrapperBase, log: (s: any) => void)
        : Promise<TraverseFunctionResult> {
                
        const hostJsonMatch = await fileSystemWrapper.findFileRecursivelyAsync(projectFolder, 'host.json', false);
        if (!hostJsonMatch) {
            throw new Error('host.json file not found under the provided project path');
        }

        log(`>>> Found host.json at ${hostJsonMatch.filePath}`);

        const hostJsonFolder = fileSystemWrapper.dirName(hostJsonMatch.filePath);
        
        let parser: FunctionProjectParserBase;

        if (await fileSystemWrapper.isCSharpProjectAsync(hostJsonFolder)) {
            parser = new CSharpFunctionProjectParser(fileSystemWrapper, log);
        } else if (await fileSystemWrapper.isFSharpProjectAsync(hostJsonFolder)) {
            parser = new FSharpFunctionProjectParser(fileSystemWrapper, log);
        } else if (await fileSystemWrapper.isJavaProjectAsync(hostJsonFolder)) {
            parser = new JavaFunctionProjectParser(fileSystemWrapper, log);
        } else if (await fileSystemWrapper.isPowershellProjectAsync(hostJsonFolder)) {
            parser = new PowershellFunctionProjectParser(fileSystemWrapper, log);
        } else if (await fileSystemWrapper.isPythonV2ProjectAsync(hostJsonFolder)) {
            parser = new PythonV2FunctionProjectParser(fileSystemWrapper, log);
        } else {
            parser = new FunctionProjectScriptParser(fileSystemWrapper, log);

            // For script-based functions use host.json's folder as the root
            projectFolder = hostJsonFolder;
        }

        const functions = await parser.traverseFunctions(projectFolder);
        
        // Also reading proxies
        const proxies = await fileSystemWrapper.readProxiesJson(projectFolder, log);

        return { functions, proxies, projectFolder };
    }
}
