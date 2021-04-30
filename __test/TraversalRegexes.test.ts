
import { TraversalRegexes } from '../traverse-func/traverseFunctionProjectUtils';

test('getStartNewOrchestrationRegex', () => {

    const orchId = `_my.orch-123`;

    const samples = [

        `await client.StartNewAsync\t( 
            nameof ( ${orchId} ), " some . string", someParam);`,
        
        `
        StartNewAsync <blah.blah> (  "${orchId}"`,

        `await client.startNew('${orchId}', instanceId, repka);`,

        `await client.start_new('${orchId}', None, None)`
    ];

    const regex = TraversalRegexes.getStartNewOrchestrationRegex(orchId);
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

        `await client.call_sub_orchestrator  ('${orchId}', None, None)`
    ];

    const regex = TraversalRegexes.getCallSubOrchestratorRegex(orchId);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('continueAsNewRegex', () => {

    const samples = [

        `context.cOnTiNuEaSnEw  
          ( input );`,
    ];

    const regex = TraversalRegexes.continueAsNewRegex;
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
        
        `client.raise_event ( instance_id, '${eventName}', event_data)`
    ];

    const regex = TraversalRegexes.getRaiseEventRegex(eventName);
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

    const regex = TraversalRegexes.getSignalEntityRegex(entityName);
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
    `;

    const regex = TraversalRegexes.waitForExternalEventRegex;

    var count = 0;
    var match: RegExpExecArray | null;
    while (!!(match = regex.exec(sample))) {
        expect(match[4]).toBe(eventName);
        count++;
    }

    expect(count).toBe(4);
});

test('getDotNetFunctionNameRegex', () => {

    const functionName = `_my.Function-123`;

    const samples = [

        `[FunctionName (  nameof \t  (${functionName}))]`,

        `[FunctionNameAttribute("${functionName}")]`,
    ];

    const regex = TraversalRegexes.getDotNetFunctionNameRegex(functionName);
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
        
        `yield context.call_activity ( "${activityName}", y)`

    ];

    const regex = TraversalRegexes.getCallActivityRegex(activityName);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});
