import { Context, HttpRequest } from '@azure/functions';
import * as DurableFunctions from 'durable-functions';

import { SignalArgumentContainer } from '../common/SignalArgumentContainer';
import { DurableEntityStateContainer } from '../common/DurableEntityStateContainer';
import { DurableEntityClientStateContainer } from '../ui/src/shared/common/DurableEntityClientStateContainer';
import { ClientPrincipalHeaderName } from '../ui/src/shared/common/Constants';

// Handles basic operations 
export default async function (context: Context, req: HttpRequest): Promise<void> {

    const entityName = context.bindingData.entityName.toString();
    const entityKey = context.bindingData.entityKey?.toString();
    const signalName = context.bindingData.signalName?.toString();
    const callingUser = req.headers[ClientPrincipalHeaderName];

    const durableClient = DurableFunctions.getClient(context);

    if (req.method === "POST") {
        
        // Producing a simple random correlationId
        const correlationId = `@${entityName}@${entityKey}@${signalName}@` + Math.random().toString(36).slice(2) + (new Date()).getTime().toString(36);

        await durableClient.signalEntity(new DurableFunctions.EntityId(entityName, entityKey),
            signalName,
            <SignalArgumentContainer>{ argument: req.body, __client_metadata: { callingUser, correlationId } }
        );

        // Returning correlationId back to client, so that it can subscribe to results
        context.res = { body: {correlationId} };

    } else if (!entityKey) {

        const entityNameString = `@${entityName}@`;
        const statuses = (await durableClient.getStatusAll())
            // We're only interested in entities
            .filter(s => (s.input as any)?.exists === true && s.instanceId.startsWith(entityNameString))
            .map(s => {

                var stateContainer = (s.input as any)?.state;

                // For some reason, state comes in form of a string here - so need to convert
                if (typeof (stateContainer) === 'string') {
                    stateContainer = JSON.parse(stateContainer);
                }

                return { instanceId: s.instanceId, stateContainer: stateContainer as DurableEntityStateContainer<any> };
            })

            // Checking access rights
            .filter(s => DurableEntityStateContainer.isAccessAllowed(s.stateContainer, callingUser))

            // Converting to ClientStateContainer
            .map(s => <DurableEntityClientStateContainer> {
                entityKey: s.instanceId.substr(entityNameString.length),
                version: s.stateContainer.__metadata.version,
                state: s.stateContainer.state
            });

        context.res = { body: statuses };

    } else {

        const stateResponse = await durableClient.readEntityState(new DurableFunctions.EntityId(entityName, entityKey));

        if (!stateResponse || !stateResponse.entityExists) {
            
            context.res = { status: 404 };

        } else {

            const stateContainer = stateResponse.entityState as DurableEntityStateContainer<any>;

            if (DurableEntityStateContainer.isAccessAllowed(stateContainer, callingUser)) {
                
                context.res = {
                    body: <DurableEntityClientStateContainer>{
                        version: stateContainer.__metadata.version,
                        state: stateContainer.state
                    }
                };

            } else {

                context.res = { status: 403 };
            }
        }
    }
};
