
import { PowershellFunctionProjectParser } from '../core/PowershellFunctionProjectParser';
import { FunctionsMap } from '../core/FunctionsMap';

class PowershellFunctionProjectParserAccessor extends PowershellFunctionProjectParser {

    constructor() {
        super(undefined as any, undefined as any);
    }

    public traverseFunctions(projectFolder: string): Promise<FunctionsMap> {
        throw new Error('Method not implemented.');
    }
    protected getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {
        throw new Error('Method not implemented.');
    }
}

const TraversalRegexes = new PowershellFunctionProjectParserAccessor() as any;

test('getStartNewOrchestrationRegex', () => {

    const orchId = `_my.orch-123`;

    const samples = [

        `$InstanceId = Start-DurableOrchestration -FunctionName "${orchId}"`
    ];

    const regex = TraversalRegexes.getStartNewOrchestrationRegex(orchId);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('getRaiseEventRegex', () => {

    const eventName = `_my.event-123`;

    const samples = [

        `Send-DurableExternalEvent -InstanceId $InstanceId -EventName "${eventName}"`
   ];

    const regex = TraversalRegexes.getRaiseEventRegex(eventName);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('waitForExternalEventRegex', () => {

    const eventName = `_my-Event123`;

    const sample = `
    
        $approved = Start-DurableExternalEventListener -EventName "${eventName}"

    `;

    const regex = TraversalRegexes.getWaitForExternalEventRegex();

    var count = 0;
    var match: RegExpExecArray | null;
    while (!!(match = regex.regex.exec(sample))) {
        expect(match[regex.pos]).toBe(eventName);
        count++;
    }

    expect(count).toBe(1);
});

test('getCallActivityRegex', () => {

    const activityName = `_my.activity-123`;

    const samples = [

        `$output += Invoke-DurableActivity -FunctionName '${activityName}' -Input 'Tokyo'`

    ];

    const regex = TraversalRegexes.getCallActivityRegex(activityName);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});
