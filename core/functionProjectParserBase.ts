import { FunctionsMap, TraverseFunctionResult } from "./FunctionsMap";
import { FileSystemWrapperBase } from './fileSystemWrapperBase';

// Parses Azure Functions projects to produce Functions map (list of all Functions, their bindings and connections to other Functions)
export abstract class FunctionProjectParserBase {

    public constructor(protected _fileSystemWrapper: FileSystemWrapperBase, protected _log: (s: any) => void) {
        
    }

    public abstract traverseFunctions(projectFolder: string) : Promise<FunctionsMap>;

    protected abstract getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string)
        : Promise<{ name: string, code: string, filePath: string, pos: number, lineNr: number }[]>    

    // Tries to match orchestrations and their activities by parsing source code
    protected async mapOrchestratorsAndActivitiesAsync(functions: FunctionsMap, projectFolder: string): Promise<FunctionsMap> {

        const functionNames = Object.keys(functions);
        
        const orchestratorNames = functionNames.filter(name => functions[name].bindings.some((b: any) => b.type === 'orchestrationTrigger'));
        const orchestrators = await this.getFunctionsAndTheirCodesAsync(orchestratorNames, projectFolder);

        const activityNames = Object.keys(functions).filter(name => functions[name].bindings.some((b: any) => b.type === 'activityTrigger'));
        const activities = await this.getFunctionsAndTheirCodesAsync(activityNames, projectFolder);

        const entityNames = functionNames.filter(name => functions[name].bindings.some((b: any) => b.type === 'entityTrigger'));
        const entities = await this.getFunctionsAndTheirCodesAsync(entityNames, projectFolder);

        const otherFunctionNames = functionNames.filter(name => !functions[name].bindings.some((b: any) => ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type)));
        const otherFunctions = await this.getFunctionsAndTheirCodesAsync(otherFunctionNames, projectFolder);

        for (const orch of orchestrators) {

            // Trying to match this orchestrator with its calling function
            const regex = this.getStartNewOrchestrationRegex(orch.name);
            for (const func of otherFunctions) {

                // If this function seems to be calling that orchestrator
                if (!!regex.exec(func.code)) {

                    functions[orch.name].isCalledBy = functions[orch.name].isCalledBy ?? [];
                    functions[orch.name].isCalledBy.push(func.name);
                }
            }

            // Matching suborchestrators
            for (const subOrch of orchestrators) {
                if (orch.name === subOrch.name) {
                    continue;
                }

                // If this orchestrator seems to be calling that suborchestrator
                const regex = this.getCallSubOrchestratorRegex(subOrch.name);
                if (!!regex.exec(orch.code)) {

                    // Mapping that suborchestrator to this orchestrator
                    functions[subOrch.name].isCalledBy = functions[subOrch.name].isCalledBy ?? [];
                    functions[subOrch.name].isCalledBy.push(orch.name);
                }
            }

            // Mapping activities to orchestrators
            this.mapActivitiesToOrchestrator(functions, orch, activityNames);

            // Checking whether orchestrator calls itself
            if (!!this.getContinueAsNewRegex().exec(orch.code)) {
                functions[orch.name].isCalledByItself = true;
            }

            // Trying to map event producers with their consumers
            const eventNames = this.getEventNames(orch.code);
            for (const eventName of eventNames) {
                
                const regex = this.getRaiseEventRegex(eventName);
                for (const func of otherFunctions) {

                    // If this function seems to be sending that event
                    if (!!regex.exec(func.code)) {
                        functions[orch.name].isSignalledBy = functions[orch.name].isSignalledBy ?? [];
                        functions[orch.name].isSignalledBy.push({ name: func.name, signalName: eventName });
                    }
                }
            }
        }

        for (const entity of entities) {

            // Trying to match this entity with its calling function
            for (const func of otherFunctions) {

                // If this function seems to be calling that entity
                const regex = this.getSignalEntityRegex(entity.name);
                if (!!regex.exec(func.code)) {
                    functions[entity.name].isCalledBy = functions[entity.name].isCalledBy ?? [];
                    functions[entity.name].isCalledBy.push(func.name);
                }
            }
        }

        // Also adding file paths and code positions
        for (const func of otherFunctions.concat(orchestrators).concat(activities).concat(entities)) {
            functions[func.name].filePath = func.filePath;
            functions[func.name].pos = func.pos;
            functions[func.name].lineNr = func.lineNr;
        }

        return functions;
    }

    // Tries to extract event names that this orchestrator is awaiting
    protected getEventNames(orchestratorCode: string): string[] {

        const result = [];

        const regex = this.getWaitForExternalEventRegex();
        var match: RegExpExecArray | null;
        while (!!(match = regex.regex.exec(orchestratorCode))) {
            result.push(match[regex.pos]);
        }

        return result;
    }

    // Tries to match orchestrator with its activities
    protected mapActivitiesToOrchestrator(functions: FunctionsMap, orch: {name: string, code: string}, activityNames: string[]): void {

        for (const activityName of activityNames) {

            // If this orchestrator seems to be calling this activity
            const regex = this.getCallActivityRegex(activityName);
            if (!!regex.exec(orch.code)) {

                // Then mapping this activity to this orchestrator
                functions[activityName].isCalledBy = functions[activityName].isCalledBy ?? [];
                functions[activityName].isCalledBy.push(orch.name);
            }
        }
    }

    protected getStartNewOrchestrationRegex(orchName: string): RegExp {
        return new RegExp(`(StartNew|StartNewAsync|start_new|scheduleNewOrchestrationInstance)(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)${orchName}\\s*["'\\),]{1}`, 'i');
    }

    protected getCallSubOrchestratorRegex(subOrchName: string): RegExp {
        return new RegExp(`(CallSubOrchestrator|CallSubOrchestratorWithRetry|call_sub_orchestrator)(Async)?(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)${subOrchName}\\s*["'\\),]{1}`, 'i');
    }

    protected getContinueAsNewRegex(): RegExp {
        return new RegExp(`ContinueAsNew\\s*\\(`, 'i');
    }

    protected getRaiseEventRegex(eventName: string): RegExp {
        return new RegExp(`(RaiseEvent|raise_event)(Async)?(.|\r|\n)*${eventName}`, 'i');
    }

    protected getSignalEntityRegex(entityName: string): RegExp {
        return new RegExp(`${entityName}\\s*["'>]{1}`);
    }

    protected getWaitForExternalEventRegex(): { regex: RegExp, pos: number } {
        return {
            regex: new RegExp(`(WaitForExternalEvent|wait_for_external_event)(<[\\s\\w,\\.-\\[\\]\\(\\)\\<\\>]+>)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`]|[\\w\\s\\.]+\\.\\s*)?([\\s\\w\\.-]+)\\s*["'\`\\),]{1}`, 'gi'),
            pos: 4
        };
    }

    protected getDotNetFunctionNameRegex(funcName: string): RegExp {
        return new RegExp(`FunctionName(Attribute)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`]|[\\w\\s\\.]+\\.\\s*)${funcName}\\s*["'\`\\)]{1}`)
    }

    protected getJavaFunctionNameRegex(funcName: string): RegExp {
        return new RegExp(`@\\s*FunctionName\\s*\\(["\\s\\w\\.-]*${funcName}"?\\)`)
    }

    protected getCallActivityRegex(activityName: string): RegExp {
        return new RegExp(`(CallActivity|call_activity)[\\s\\w,\\.-<>\\[\\]\\(\\)\\?]*\\([\\s\\w\\.-]*["'\`]?${activityName}\\s*["'\`\\),]{1}`, 'i');
    }

    protected getClassDefinitionRegex(className: string): RegExp {
        return new RegExp(`class\\s*${className}`)
    }
}
