import { FunctionsMap } from "./FunctionsMap";
import { posToLineNr } from "./traverseFunctionProjectUtils";

import { FunctionProjectParserBase } from './functionProjectParserBase';

export class PowershellFunctionProjectParser extends FunctionProjectParserBase {

    public async traverseFunctions(projectFolder: string): Promise<FunctionsMap>{
        
        let functions: FunctionsMap;

        functions = await this._fileSystemWrapper.readFunctionsJson(projectFolder, this._log);

        // Now enriching it with more info extracted from code
        functions = await this.mapOrchestratorsAndActivitiesAsync(functions, projectFolder);

        return functions;
    }

    protected async getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {

        const promises = functionNames.map(async name => {

            let match = await this._fileSystemWrapper.findFileRecursivelyAsync(
                this._fileSystemWrapper.joinPath(hostJsonFolder, name),
                '.+\\.ps1$',
                true);
            
            if (!match) {
                return undefined;
            }
    
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = posToLineNr(match.code, pos);
    
            return { name, code: match.code, filePath: match.filePath, pos, lineNr };
        });
    
        return (await Promise.all(promises)).filter(f => !!f) as any;
    }

    protected getStartNewOrchestrationRegex(orchName: string): RegExp {
        return new RegExp(`(Start-DurableOrchestration|Start-NewOrchestration).*-FunctionName\\s*["']${orchName}["']`, 'i');
    }

    protected getCallActivityRegex(activityName: string): RegExp {
        return new RegExp(`(Invoke-DurableActivity|Invoke-ActivityFunction).*-FunctionName\\s*["']${activityName}["']`, 'i');
    }

    protected getRaiseEventRegex(eventName: string): RegExp {
        return new RegExp(`Send-DurableExternalEvent.*-EventName\\s*["']${eventName}["']`, 'i');
    }

    protected getWaitForExternalEventRegex(): { regex: RegExp, pos: number } {
        return {
            regex: new RegExp(`Start-DurableExternalEventListener.*-EventName\\s*["']([\\s\\w\\.-]+)["']`, 'gi'),
            pos: 1
        };
    }
}
