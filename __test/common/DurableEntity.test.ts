import { DurableEntity, VisibilityEnum } from '../../common/DurableEntity';
import { DurableEntityStateContainer } from '../../common/DurableEntityStateContainer';
import { SignalRClientHandlerName, UpdateMetadataServiceMethodName } from '../../ui/src/shared/common/Constants';

test('throws when access is not allowed', async () => {

    const context = {
        df: {
            entityName: 'ent',
            entityKey: '123',

            getInput: () => { return {
                __client_metadata: {
                    callingUser: 'userB'
                }
            };},

            getState: () => new DurableEntityStateContainer({}, VisibilityEnum.ToOwnerOnly, 'userA')
        }
    };

    const entity = new DurableEntity(context as any);

    try {
        await entity.handleSignal();
    } catch (err) {
        expect(err.message).toBe('Access to @ent@123 not allowed');
    }
});

test('throws when access to metadata is not allowed', async () => {

    const context = {
        df: {
            entityName: 'ent',
            entityKey: '123',
            operationName: UpdateMetadataServiceMethodName,

            getInput: () => {
                return {
                    __client_metadata: {
                        callingUser: 'userA'
                    }
                };
            },

            getState: () => new DurableEntityStateContainer({}, VisibilityEnum.ToEveryone, 'userB')
        }
    };

    const entity = new DurableEntity(context as any);

    try {
        await entity.handleSignal();
    } catch (err) {
        expect(err.message).toBe('Non-owner is not allowed to update metadata of @ent@123');
    }
});

test('sends notifications when updating metadata', async () => {

    const user = 'userA';

    const context = {
        df: {
            entityName: 'ent',
            entityKey: '123',
            operationName: UpdateMetadataServiceMethodName,

            getInput: () => {
                return {
                    __client_metadata: {
                        callingUser: user
                    }
                };
            },

            getState: () => new DurableEntityStateContainer({}, VisibilityEnum.ToOwnerOnly, user),

            setState: () => { },            
        },

        bindings: {}
    };

    const entity = new DurableEntity(context as any);

    await entity.handleSignal();

    const signalRMessageContainer = (context as any).bindings.signalRMessages[0];
    expect(signalRMessageContainer.userId).toBe(user);
    expect(signalRMessageContainer.target).toBe(SignalRClientHandlerName);

    const signalRMessage = signalRMessageContainer.arguments[0];
    expect(signalRMessage.entityName).toBe(context.df.entityName);
    expect(signalRMessage.entityKey).toBe(context.df.entityKey);
    expect(signalRMessage.stateDiff.length).toBe(0);
    expect(signalRMessage.version).toBe(0);
    expect(signalRMessage.version).toBe(0);
    expect(signalRMessage.isEntityDestructed).toBe(false);

});
