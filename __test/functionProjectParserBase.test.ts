
import { FunctionProjectCodeParser } from '../core/functionProjectCodeParser';
import { FunctionsMap } from '../core/FunctionsMap';

class FunctionProjectParserAccessor extends FunctionProjectCodeParser {

    constructor() {
        super(undefined as any, undefined as any);
    }

    protected traverseProjectCode(projectFolder: string): Promise<FunctionsMap> {
        throw new Error('Method not implemented.');
    }
    public traverseFunctions(projectFolder: string): Promise<FunctionsMap> {
        throw new Error('Method not implemented.');
    }
    protected getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {
        throw new Error('Method not implemented.');
    }
}

const parser = new FunctionProjectParserAccessor() as any;

test('getStartNewOrchestrationRegex', () => {

    const orchId = `_my.orch-123`;

    const samples = [

        `await client.StartNewAsync\t( 
            nameof ( ${orchId} ), " some . string", someParam);`,
        
        `
        StartNewAsync <blah.blah> (  "${orchId}"`,

        `await client.startNew('${orchId}', instanceId, repka);`,

        `await client.start_new('${orchId}', None, None)`,

        `await starter.StartNewAsync<Dictionary<string, int>>( nameof(My.Namespace.${orchId}) );`,

        `await starter.StartNewAsync( My.Constants.${orchId}, instanceId, checkpointTimestamp);`,

        `String instanceId = client.scheduleNewOrchestrationInstance("${orchId}"); `
    ];

    const regex = parser.getStartNewOrchestrationRegex(orchId);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('getCallSubOrchestratorRegex', () => {

    const orchId = `_my.sub-orch123`;

    const samples = [

        `await client.CallSubOrchestratorWithRetry (
            nameof ( ${orchId} ), " some , string ", someParam);`,

        `
        CallSubOrchestratorAsync
            <blah.blah> (  "${orchId}"`,

        `await client.callSubOrchestrator('${orchId}', instanceId, repka);`,

        `await client.call_sub_orchestrator  ('${orchId}', None, None)`,

        `var result = await context.CallSubOrchestratorAsync< Tuple<int, int> >(nameof(My.Namespace.${orchId}), null, null);`,

        `await client.callSubOrchestrator<DateTime?>('${orchId}');`,

        `c.CallSubOrchestratorWithRetry(My.Constants.${orchId}, " some , string ", someParam);`,
    ];

    const regex = parser.getCallSubOrchestratorRegex(orchId);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('continueAsNewRegex', () => {

    const samples = [

        `context.cOnTiNuEaSnEw  
          ( input );`,
    ];

    const regex = parser.getContinueAsNewRegex();
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('getRaiseEventRegex', () => {

    const eventName = `_my.event-123`;

    const samples = [

        `await client.RaiseEventAsync ( param1, "param2",  nameof (
             ${eventName} ));`,
       
        `.raiseEvent(instanceId, "${eventName}", eventData);`,
        
        `client.raise_event ( instance_id, '${eventName}', event_data)`,

        `c.RaiseEventAsync(p1, "p2", My.Constants.${eventName} );`,
   ];

    const regex = parser.getRaiseEventRegex(eventName);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('getSignalEntityRegex', () => {

    const entityName = `_my.entity-123`;

    const samples = [

        `await durableClient.SignalEntityAsync<I${entityName}>(appointmentId,
                p => p.InitializeParticipantsAsync(new HashSet<string>(nickNames)));`,
    ];

    const regex = parser.getSignalEntityRegex(entityName);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('waitForExternalEventRegex', () => {

    const eventName = `_my-Event123`;

    const sample = `await context.WaitForExternalEvent  (
        nameof(${eventName}) );
    
        await context.WaitForExternalEvent("${eventName}");
        
        context.df.waitForExternalEvent ( '${eventName}' );

        gate3 = context.wait_for_external_event
            ( '${eventName}')

        c.WaitForExternalEvent( My.Constants. ${eventName})

        c.WaitForExternalEvent<MyGeneric<MyType1,MyType2>>( "${eventName}" )

        c.WaitForExternalEvent< DateTime?  >( "${eventName}" )
    `;

    const regex = parser.getWaitForExternalEventRegex();

    var count = 0;
    var match: RegExpExecArray | null;
    while (!!(match = regex.regex.exec(sample))) {
        expect(match[regex.pos]).toBe(eventName);
        count++;
    }

    expect(count).toBe(7);
});

test('getDotNetFunctionNameRegex', () => {

    const functionName = `_my.Function-123`;

    const samples = [

        `[FunctionName (  nameof \t  (${functionName}))]`,

        `[FunctionNameAttribute("${functionName}")]`,
        
        ` [<FunctionName("${functionName}")>]
  let Run([<OrchestrationTrigger>] backupContext: DurableOrchestrationContext) = task {`,

      `[FunctionName( My.Class. With.  Constants.   ${functionName})]`,

      `[FunctionNameAttribute(\`${functionName}\`)]`,
      
    ];

    const regex = parser.getFunctionStartRegex(functionName);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('getCallActivityRegex', () => {

    const activityName = `_my.activity-123`;

    const samples = [

        `await context.CallActivityWithRetryAsync<blah.blah>( nameof  (${activityName}), param1, param2);`,

        `yield context.df.callActivity
            ("${activityName}", x);`,
        
        `yield context.call_activity ( "${activityName}", y)`,

        `backupContext.CallActivityAsync<string[]>("${activityName}", rootDirectory)`,

        `ctx.CallActivity<DateTime?>("${activityName}")`,

        `await context.CallActivityAsync<List<(long id, string name)>>("${activityName}", organizationName);`,

        `c.CallActivityWithRetryAsync( My.Constants.${activityName}, param1, param2);`,
    ];

    const regex = parser.getCallActivityRegex(activityName);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('bindingAttributeRegex', () => {

    const samples = [
        `[return:Table("MyTable")]`,
        `[ BlobTrigger ( "claims/{fileFullName}", Connection = "AzureWebJobsStorage")] Stream fileStream`,
        `([<ServiceBus(TopicName, Connection = ServiceBusConnectionString, EntityType = EntityType.Topic)>] topic: IAsyncCollector<Message>)`,
        `[QueueOutputAttribute("myQueue")]`,
        ` @BlobTrigger(name = "content", path = "samples-workitems/{name}", dataType = "binary") byte[] content,`
    ];

    const results = [
        ['return:', 'Table'],
        [undefined, 'BlobTrigger'],
        [undefined, 'ServiceBus'],
        [undefined, 'QueueOutputAttribute'],
        [undefined, 'BlobTrigger'],
    ];

    const regex = parser.getBindingAttributeRegex();
    for (var i = 0; i < samples.length; i++) {

        // Need to reset the regex, because it's 'global' aka stateful
        regex.regex.lastIndex = 0;

        const sample = samples[i];
        const result = results[i];

        const match = regex.regex.exec(sample);
        expect(match).not.toBeNull();
        expect(match[regex.pos-1]).toBe(result[0]);
        expect(match[regex.pos]).toBe(result[1]);
    }
});

test('isOutRegex', () => {

    const samples = [
        `  ]out string message,`,
        `] out string[] results (`,
        ` ] ICollector myCollector,`,
        `]IAsyncCollector myCollector(`,
    ];

    const regex = parser.isOutRegex;
    for (var i = 0; i < samples.length; i++) {

        // Need to reset the regex, because it's 'global' aka stateful
        regex.lastIndex = 0;

        const sample = samples[i];

        const match = regex.exec(sample);
        expect(match).not.toBeNull();
    }
});

test('singleParamRegex', () => {

    const samples = [
        `("Users")CloudTable users`,
        `( nameof (MyDataFile))] string data`,
        ` ( Constants.MyQueue )  string msg`,
    ];

    const results = [
        `Users`,
        `MyDataFile`,
        `Constants.MyQueue`,
    ];

    const regex = parser.singleParamRegex;
    for (var i = 0; i < samples.length; i++) {

        const sample = samples[i];
        const result = results[i];

        const match = regex.exec(sample);
        expect(match).not.toBeNull();
        expect(match[2]).toBe(result);
    }
});

test('functionReturnTypeRegex', () => {

    const samples = [

        ` public  MyNamespace.MyOutputClass_1   Run`,

        `  public  static MyOutputClass_2   Run`,
        `   public static  Task<MyOutputClass_3>   Run`,
        `    public async Task<MyOutputClass_4>   Run`,

        `  public  static    async Task<MyOutputClass_5>   Run`,
        `public  async static Task<MyOutputClass_6>   Run`,
    ];

    const results = [
        ['MyNamespace.MyOutputClass_1'],
        ['MyOutputClass_2'],
        ['MyOutputClass_3'],
        ['MyOutputClass_4'],
        ['MyOutputClass_5'],
        ['MyOutputClass_6'],
    ];

    const regex = parser.functionReturnTypeRegex;
    for (var i = 0; i < samples.length; i++) {

        // Need to reset the regex, because it's 'global' aka stateful
        regex.lastIndex = 0;

        const sample = samples[i];
        const result = results[i];

        const match = regex.exec(sample);
        expect(match).not.toBeNull();
        expect(match[3]).toBe(result[0]);
    }
});
