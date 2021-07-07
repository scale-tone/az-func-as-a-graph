
import { DotNetBindingsParser } from '../traverse-func/traverseFunctionProjectUtils';

test('bindingAttributeRegex', () => {

    const samples = [
        `[return:Table("MyTable")]`,
        `[ BlobTrigger ( "claims/{fileFullName}", Connection = "AzureWebJobsStorage")] Stream fileStream`,
        `([<ServiceBus(TopicName, Connection = ServiceBusConnectionString, EntityType = EntityType.Topic)>] topic: IAsyncCollector<Message>)`
    ];

    const results = [
        ['return:', 'Table'],
        [undefined, 'BlobTrigger'],
        [undefined, 'ServiceBus'],
    ];

    const regex = DotNetBindingsParser.bindingAttributeRegex;
    for (var i = 0; i < samples.length; i++) {

        // Need to reset the regex, because it's 'global' aka stateful
        regex.lastIndex = 0;

        const sample = samples[i];
        const result = results[i];

        const match = regex.exec(sample);
        expect(match).not.toBeNull();
        expect(match[2]).toBe(result[0]);
        expect(match[3]).toBe(result[1]);
    }
});

test('isOutRegex', () => {

    const samples = [
        `  ]out string message,`,
        `] out string[] results (`,
        ` ] ICollector myCollector,`,
        `]IAsyncCollector myCollector(`,
    ];

    const regex = DotNetBindingsParser.isOutRegex;
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

    const regex = DotNetBindingsParser.singleParamRegex;
    for (var i = 0; i < samples.length; i++) {

        const sample = samples[i];
        const result = results[i];

        const match = regex.exec(sample);
        expect(match).not.toBeNull();
        expect(match[2]).toBe(result);
    }
});
