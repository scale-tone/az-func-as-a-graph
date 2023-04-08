
import { CSharpFunctionProjectParser } from '../core/cSharpFunctionProjectParser';
import { FSharpFunctionProjectParser } from '../core/fSharpFunctionProjectParser';

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

    const parser = new CSharpFunctionProjectParser(undefined as any, undefined as any) as any;

    for (var i = 0; i < samples.length; i++) {

        const sample = samples[i];
        const result = results[i];

        const regex = parser.getFunctionAttributeRegex();
        const match = regex.regex.exec(sample);
        
        expect(match).not.toBeNull();
        expect(match[regex.pos]).toBe(result[0]);
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

    const parser = new FSharpFunctionProjectParser(undefined as any, undefined as any) as any;

    for (var i = 0; i < samples.length; i++) {

        const sample = samples[i];
        const result = results[i];

        const regex = parser.getFunctionAttributeRegex();
        const match = regex.regex.exec(sample);

        expect(match).not.toBeNull();
        expect(match[regex.pos]).toBe(result[0]);
    }
});
