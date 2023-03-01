
import { BindingsParser } from '../func-project-parser/traverseFunctionProjectUtils';

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

    const regex = BindingsParser.bindingAttributeRegex;
    for (var i = 0; i < samples.length; i++) {

        // Need to reset the regex, because it's 'global' aka stateful
        regex.lastIndex = 0;

        const sample = samples[i];
        const result = results[i];

        const match = regex.exec(sample);
        expect(match).not.toBeNull();
        expect(match[3]).toBe(result[0]);
        expect(match[4]).toBe(result[1]);
    }
});

test('isOutRegex', () => {

    const samples = [
        `  ]out string message,`,
        `] out string[] results (`,
        ` ] ICollector myCollector,`,
        `]IAsyncCollector myCollector(`,
    ];

    const regex = BindingsParser.isOutRegex;
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

    const regex = BindingsParser.singleParamRegex;
    for (var i = 0; i < samples.length; i++) {

        const sample = samples[i];
        const result = results[i];

        const match = regex.exec(sample);
        expect(match).not.toBeNull();
        expect(match[2]).toBe(result);
    }
});

test('functionAttributeRegex', () => {

    const samples = [

        ` [Function(nameof(MyFunc_123))] 
        [QueueOutput("output-queue")]
        public static string[] Run([QueueTrigger("input-queue")] Book myQueueItem, FunctionContext context)
        {`,

        ` [  Function   (    nameof     (     MyNamespace.MyFunc_123 )  )   ]     
        {`,

        ` [  Function   (    "My-Func-123"  )   ]     
            public static Book Run(
                [QueueTrigger("functionstesting2", Connection = "AzureWebJobsStorage")] Book myQueueItem,
                [BlobInput("test-samples/sample1.txt", Connection = "AzureWebJobsStorage")] string myBlob)
        {`,

        `[Function(Constants .  MyFuncName)   ]`,
        `[FunctionName(Constants.MyFuncName)]`,
    ];

    const results = [

        ['nameof(MyFunc_123)'],
        ['    nameof     (     MyNamespace.MyFunc_123 )  '],
        ['    "My-Func-123"  '],
        ['Constants .  MyFuncName'],
        ['Constants.MyFuncName'],
    ];

    const regex = BindingsParser.functionAttributeRegex;
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


test('fSharpFunctionAttributeRegex', () => {

    const samples = [

        `
        [<FunctionName("AttributeBased")>]
        `,

        `  [<FunctionName("E3_Counter")>]
        `,

        `    [<Function("Execute")>]
        `,
    ];

    const results = [

        ['"AttributeBased"'],
        ['"E3_Counter"'],
        ['"Execute"'],
    ];

    const regex = BindingsParser.fSharpFunctionAttributeRegex;
    for (var i = 0; i < samples.length; i++) {

        // Need to reset the regex, because it's 'global' aka stateful
        regex.lastIndex = 0;

        const sample = samples[i];
        const result = results[i];

        const match = regex.exec(sample);
        expect(match).not.toBeNull();
        expect(match[2]).toBe(result[0]);
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

    const regex = BindingsParser.functionReturnTypeRegex;
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
