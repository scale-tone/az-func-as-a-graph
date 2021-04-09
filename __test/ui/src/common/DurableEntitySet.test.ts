
import { DurableEntitySet } from '../../../../ui/src/common/DurableEntitySet';
import { BackendBaseUri } from '../../../../ui/src/common/DurableHttpClient';
import { DurableEntityClientStateContainer } from '../../../../ui/src/shared/common/DurableEntityClientStateContainer';

test('attaches an entity and fetches its state from server', async () => {

    // Need to set it to an absolute URL to calm down SignalR's HttpConnection
    (BackendBaseUri as any) = 'http://localhost:7071/a/p/i';

    const initialFieldValue = 'value1';
    const fetchedFieldValue = 'value2';

    const clientStateContainer = <DurableEntityClientStateContainer>{
        version: 1,
        state: {
            someField: fetchedFieldValue
        }
    };

    (DurableEntitySet as any).HttpClient = {

        send: (request) => {
            throw new Error('Should not be used');
        },

        get: (request) => { return Promise.resolve({
            content: JSON.stringify(clientStateContainer)
        });}
    };

    const observableState = DurableEntitySet.attachEntity('myentity', 'mykey', { someField: initialFieldValue });

    expect(observableState.someField).toBe(initialFieldValue);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(observableState.someField).toBe(fetchedFieldValue);
});
