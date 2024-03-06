import { FunctionsMap } from "./FunctionsMap";

import { FunctionProjectParserBase } from './functionProjectParserBase';
import { RegExAndPos } from "./fileSystemWrapperBase";

export abstract class FunctionProjectCodeParser extends FunctionProjectParserBase {

    public async traverseFunctions(projectFolder: string): Promise<FunctionsMap>{
        
        let functions: FunctionsMap;

        functions = await this.traverseProjectCode(projectFolder);

        // Now enriching it with more info extracted from code
        functions = await this.mapOrchestratorsAndActivitiesAsync(functions, projectFolder);

        return functions;
    }

    protected abstract traverseProjectCode(projectFolder: string): Promise<FunctionsMap>;

    protected getFunctionStartRegex(funcName: string): RegExp {
        return new RegExp(`Function(Name)?(Attribute)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`]|[\\w\\s\\.]+\\.\\s*)${funcName}\\s*["'\`\\)]{1}`)
    }

    protected getFunctionAttributeRegex(): RegExAndPos {
        return {
            regex: new RegExp(`\\[\\s*Function(Name)?(Attribute)?\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)\\s*\\]`, 'g'),
            pos: 3
        };
    }
}
