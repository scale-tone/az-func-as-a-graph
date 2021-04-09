import * as rfc6902 from 'rfc6902';
import { IEntityFunctionContext } from 'durable-functions/lib/src/classes';

import { EntityStateChangedMessage, EntitySignalResponseMessage } from '../ui/src/shared/common/SignalRNotifications';
import { ISetEntityMetadataRequest } from '../ui/src/shared/common/ISetEntityMetadataRequest';
import { SignalRClientHandlerName, SignalRSignalResponseHandlerName, UpdateMetadataServiceMethodName } from '../ui/src/shared/common/Constants';
import { DurableEntityStateContainer, DurableEntityStateMetadata } from './DurableEntityStateContainer';
import { SignalArgumentContainer } from './SignalArgumentContainer';

// Levels of visibility currently supported
export enum VisibilityEnum {
    ToOwnerOnly = 0,
    ToListOfUsers,
    ToEveryone
}

// Base class for Durable Entities. Implements handling signals (by calling child's method with corresponding name)
export class DurableEntity<TState extends object> {

    // Entity state
    protected get state(): TState { return this._stateContainer.state; }

    // Entity state metadata
    protected get stateMetadata(): DurableEntityStateMetadata { return this._stateContainer.__metadata; }

    // Incoming signal metadata
    protected get callingUser(): string { return this._callingUser; }

    // To be called by entity, when it decides to kill itself
    protected destructOnExit(): void { this._destructOnExit = true; }

    constructor(protected _context: IEntityFunctionContext) {
    }

    // Override this to provide the state for a newly created entity
    protected initializeState(): TState {
        return {} as TState;
    }

    // Override this to set a different visibility level for your entity
    protected get visibility(): VisibilityEnum {
        return VisibilityEnum.ToOwnerOnly;
    }

    async handleSignal() {

        const argumentContainer = this._context.df.getInput() as SignalArgumentContainer;

        // If the signal was sent by our manage-entities method, then it should contain __client_metadata field with user name in it
        const signalMetadata = !argumentContainer ? null : argumentContainer.__client_metadata;
        const signalArgument = (!signalMetadata) ? argumentContainer : argumentContainer.argument;
        this._callingUser = signalMetadata?.callingUser;

        // Signals coming from client always have __client_metadata property filled. DurableEntityProxy doesn't set it.
        const isItServerSideCall = !signalMetadata;

        // Loading actor's state
        this._stateContainer = this._context.df.getState(() => new DurableEntityStateContainer(
            this.initializeState(),
            this.visibility,
            this._callingUser
        )) as DurableEntityStateContainer<TState>;

        // Always notifying about newly created entities
        var metadataHasChanged = !this._stateContainer.__metadata.version;

        // Checking access rights
        if (!isItServerSideCall && (!DurableEntityStateContainer.isAccessAllowed(this._stateContainer, this._callingUser))) {
            throw new Error(`Access to @${this._context.df.entityName}@${this._context.df.entityKey} not allowed`);
        }

        // Cloning the state
        const oldState = JSON.parse(JSON.stringify(this._stateContainer.state)) as TState;

        const operationName = this._context.df.operationName!;
        if (operationName === UpdateMetadataServiceMethodName) { // if this is a service method

            // Only the owner can update metadata
            if (this._stateContainer.__metadata.owner !== this._callingUser) {
                throw new Error(`Non-owner is not allowed to update metadata of @${this._context.df.entityName}@${this._context.df.entityKey}`);
            }

            // Currently only one metadata field can be updated
            const setMetadataRequest = signalArgument as ISetEntityMetadataRequest;
            if (!!setMetadataRequest?.allowedUsers) {
                this._stateContainer.__metadata.allowedUsers = signalArgument.allowedUsers;
            }

            metadataHasChanged = true;
            
        } else if (typeof this[operationName] === 'function') { // if there is a method with that name in child class

            try {

                // Executing the handler
                var result = this[operationName](signalArgument);

                // Checking if it is a promise that needs to be awaited
                if (DurableEntity.isPromise(result)) {
                    result = await result;
                }

                // Setting return value, if any
                this._context.df.return(result);

                // Sending return value to the calling user, if any
                this.sendSignalResponseViaSignalR(this._callingUser, signalMetadata?.correlationId, result, undefined);

            } catch (err) {
                this.sendSignalResponseViaSignalR(this._callingUser, signalMetadata?.correlationId, undefined, err.message ?? `${operationName} failed`);
                throw err;
            }
        }

        // Checking if the state has changed
        const stateDiff = rfc6902.createPatch(oldState, this._stateContainer.state);

        if (!!stateDiff.length) {
            this._stateContainer.__metadata.version++;
        }

        // If the handler signalled the end of lifetime, then destroying ourselves
        if (this._destructOnExit) {
            this._context.df.destructOnExit();

            // Also notifying clients that the entity passed away
            this.sendUpdatedStateViaSignalR(this._stateContainer, stateDiff, true);
            return;
        }

        // Saving actor's state, but only if it has changed or the entity has just been created
        if (!!stateDiff.length || metadataHasChanged) {
            
            this._context.df.setState(this._stateContainer);

            // Sending the updated state to clients
            this.sendUpdatedStateViaSignalR(this._stateContainer, stateDiff, false);
        }
    }

    private _stateContainer: DurableEntityStateContainer<TState>;
    private _callingUser: string;
    private _destructOnExit: boolean = false;

    private sendUpdatedStateViaSignalR(stateContainer: DurableEntityStateContainer<TState>, stateDiff: rfc6902.Operation[], isDestructed: boolean ) {

        const notification: EntityStateChangedMessage = {
            entityName: this._context.df.entityName,
            entityKey: this._context.df.entityKey,
            stateDiff,
            version: stateContainer.__metadata.version,
            isEntityDestructed: isDestructed
        };

        if (!this._context.bindings.signalRMessages) {
            this._context.bindings.signalRMessages = [];
        }

        switch (stateContainer.__metadata.visibility) {
            case VisibilityEnum.ToOwnerOnly:

                // Sending to owner only
                if (!!stateContainer.__metadata.owner) {
                    
                    this._context.bindings.signalRMessages.push({
                        userId: stateContainer.__metadata.owner,
                        target: SignalRClientHandlerName,
                        arguments: [notification]
                    });
                }
                
                break;
            case VisibilityEnum.ToListOfUsers:

                // Sending to all allowed users
                stateContainer.__metadata.allowedUsers.map(user => {

                    this._context.bindings.signalRMessages.push({
                        userId: user,
                        target: SignalRClientHandlerName,
                        arguments: [notification]
                    });
                });

                break;
            case VisibilityEnum.ToEveryone:

                // Sending to the public
                this._context.bindings.signalRMessages.push({
                    target: SignalRClientHandlerName,
                    arguments: [notification]
                });

                break;
        }
    }

    private sendSignalResponseViaSignalR(callingUser: string, correlationId: string, result: any, errorMessage: string) {

        if (!callingUser || !correlationId) {
            return;
        }

        const notification: EntitySignalResponseMessage = {
            entityName: this._context.df.entityName,
            entityKey: this._context.df.entityKey,
            correlationId,
            result,
            errorMessage
        };

        if (!this._context.bindings.signalRMessages) {
            this._context.bindings.signalRMessages = [];
        }

        this._context.bindings.signalRMessages.push({
            userId: callingUser,
            target: SignalRSignalResponseHandlerName,
            arguments: [notification]
        });
    }

    private static isPromise(returnValue: any): boolean {
        return (!!returnValue) && typeof returnValue.then === 'function';
    }
}
