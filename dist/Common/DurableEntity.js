"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurableEntity = exports.VisibilityEnum = void 0;
const rfc6902 = require("rfc6902");
const Constants_1 = require("../ui/src/shared/common/Constants");
const DurableEntityStateContainer_1 = require("./DurableEntityStateContainer");
// Levels of visibility currently supported
var VisibilityEnum;
(function (VisibilityEnum) {
    VisibilityEnum[VisibilityEnum["ToOwnerOnly"] = 0] = "ToOwnerOnly";
    VisibilityEnum[VisibilityEnum["ToListOfUsers"] = 1] = "ToListOfUsers";
    VisibilityEnum[VisibilityEnum["ToEveryone"] = 2] = "ToEveryone";
})(VisibilityEnum = exports.VisibilityEnum || (exports.VisibilityEnum = {}));
// Base class for Durable Entities. Implements handling signals (by calling child's method with corresponding name)
class DurableEntity {
    constructor(_context) {
        this._context = _context;
        this._destructOnExit = false;
    }
    // Entity state
    get state() { return this._stateContainer.state; }
    // Entity state metadata
    get stateMetadata() { return this._stateContainer.__metadata; }
    // Incoming signal metadata
    get callingUser() { return this._callingUser; }
    // To be called by entity, when it decides to kill itself
    destructOnExit() { this._destructOnExit = true; }
    // Override this to provide the state for a newly created entity
    initializeState() {
        return {};
    }
    // Override this to set a different visibility level for your entity
    get visibility() {
        return VisibilityEnum.ToOwnerOnly;
    }
    handleSignal() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const argumentContainer = this._context.df.getInput();
            // If the signal was sent by our manage-entities method, then it should contain __client_metadata field with user name in it
            const signalMetadata = !argumentContainer ? null : argumentContainer.__client_metadata;
            const signalArgument = (!signalMetadata) ? argumentContainer : argumentContainer.argument;
            this._callingUser = signalMetadata === null || signalMetadata === void 0 ? void 0 : signalMetadata.callingUser;
            // Signals coming from client always have __client_metadata property filled. DurableEntityProxy doesn't set it.
            const isItServerSideCall = !signalMetadata;
            // Loading actor's state
            this._stateContainer = this._context.df.getState(() => new DurableEntityStateContainer_1.DurableEntityStateContainer(this.initializeState(), this.visibility, this._callingUser));
            // Always notifying about newly created entities
            var metadataHasChanged = !this._stateContainer.__metadata.version;
            // Checking access rights
            if (!isItServerSideCall && (!DurableEntityStateContainer_1.DurableEntityStateContainer.isAccessAllowed(this._stateContainer, this._callingUser))) {
                throw new Error(`Access to @${this._context.df.entityName}@${this._context.df.entityKey} not allowed`);
            }
            // Cloning the state
            const oldState = JSON.parse(JSON.stringify(this._stateContainer.state));
            const operationName = this._context.df.operationName;
            if (operationName === Constants_1.UpdateMetadataServiceMethodName) { // if this is a service method
                // Only the owner can update metadata
                if (this._stateContainer.__metadata.owner !== this._callingUser) {
                    throw new Error(`Non-owner is not allowed to update metadata of @${this._context.df.entityName}@${this._context.df.entityKey}`);
                }
                // Currently only one metadata field can be updated
                const setMetadataRequest = signalArgument;
                if (!!(setMetadataRequest === null || setMetadataRequest === void 0 ? void 0 : setMetadataRequest.allowedUsers)) {
                    this._stateContainer.__metadata.allowedUsers = signalArgument.allowedUsers;
                }
                metadataHasChanged = true;
            }
            else if (typeof this[operationName] === 'function') { // if there is a method with that name in child class
                try {
                    // Executing the handler
                    var result = this[operationName](signalArgument);
                    // Checking if it is a promise that needs to be awaited
                    if (DurableEntity.isPromise(result)) {
                        result = yield result;
                    }
                    // Setting return value, if any
                    this._context.df.return(result);
                    // Sending return value to the calling user, if any
                    this.sendSignalResponseViaSignalR(this._callingUser, signalMetadata === null || signalMetadata === void 0 ? void 0 : signalMetadata.correlationId, result, undefined);
                }
                catch (err) {
                    this.sendSignalResponseViaSignalR(this._callingUser, signalMetadata === null || signalMetadata === void 0 ? void 0 : signalMetadata.correlationId, undefined, (_a = err.message) !== null && _a !== void 0 ? _a : `${operationName} failed`);
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
        });
    }
    sendUpdatedStateViaSignalR(stateContainer, stateDiff, isDestructed) {
        const notification = {
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
                        target: Constants_1.SignalRClientHandlerName,
                        arguments: [notification]
                    });
                }
                break;
            case VisibilityEnum.ToListOfUsers:
                // Sending to all allowed users
                stateContainer.__metadata.allowedUsers.map(user => {
                    this._context.bindings.signalRMessages.push({
                        userId: user,
                        target: Constants_1.SignalRClientHandlerName,
                        arguments: [notification]
                    });
                });
                break;
            case VisibilityEnum.ToEveryone:
                // Sending to the public
                this._context.bindings.signalRMessages.push({
                    target: Constants_1.SignalRClientHandlerName,
                    arguments: [notification]
                });
                break;
        }
    }
    sendSignalResponseViaSignalR(callingUser, correlationId, result, errorMessage) {
        if (!callingUser || !correlationId) {
            return;
        }
        const notification = {
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
            target: Constants_1.SignalRSignalResponseHandlerName,
            arguments: [notification]
        });
    }
    static isPromise(returnValue) {
        return (!!returnValue) && typeof returnValue.then === 'function';
    }
}
exports.DurableEntity = DurableEntity;
//# sourceMappingURL=DurableEntity.js.map