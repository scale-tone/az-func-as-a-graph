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
const DurableFunctions = require("durable-functions");
const DurableEntityStateContainer_1 = require("../common/DurableEntityStateContainer");
const Constants_1 = require("../ui/src/shared/common/Constants");
// Handles basic operations 
function default_1(context, req) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const entityName = context.bindingData.entityName.toString();
        const entityKey = (_a = context.bindingData.entityKey) === null || _a === void 0 ? void 0 : _a.toString();
        const signalName = (_b = context.bindingData.signalName) === null || _b === void 0 ? void 0 : _b.toString();
        const callingUser = req.headers[Constants_1.ClientPrincipalHeaderName];
        const durableClient = DurableFunctions.getClient(context);
        if (req.method === "POST") {
            // Producing a simple random correlationId
            const correlationId = `@${entityName}@${entityKey}@${signalName}@` + Math.random().toString(36).slice(2) + (new Date()).getTime().toString(36);
            yield durableClient.signalEntity(new DurableFunctions.EntityId(entityName, entityKey), signalName, { argument: req.body, __client_metadata: { callingUser, correlationId } });
            // Returning correlationId back to client, so that it can subscribe to results
            context.res = { body: { correlationId } };
        }
        else if (!entityKey) {
            const entityNameString = `@${entityName}@`;
            const statuses = (yield durableClient.getStatusAll())
                // We're only interested in entities
                .filter(s => { var _a; return ((_a = s.input) === null || _a === void 0 ? void 0 : _a.exists) === true && s.instanceId.startsWith(entityNameString); })
                .map(s => {
                var _a;
                var stateContainer = (_a = s.input) === null || _a === void 0 ? void 0 : _a.state;
                // For some reason, state comes in form of a string here - so need to convert
                if (typeof (stateContainer) === 'string') {
                    stateContainer = JSON.parse(stateContainer);
                }
                return { instanceId: s.instanceId, stateContainer: stateContainer };
            })
                // Checking access rights
                .filter(s => DurableEntityStateContainer_1.DurableEntityStateContainer.isAccessAllowed(s.stateContainer, callingUser))
                // Converting to ClientStateContainer
                .map(s => ({
                entityKey: s.instanceId.substr(entityNameString.length),
                version: s.stateContainer.__metadata.version,
                state: s.stateContainer.state
            }));
            context.res = { body: statuses };
        }
        else {
            const stateResponse = yield durableClient.readEntityState(new DurableFunctions.EntityId(entityName, entityKey));
            if (!stateResponse || !stateResponse.entityExists) {
                context.res = { status: 404 };
            }
            else {
                const stateContainer = stateResponse.entityState;
                if (DurableEntityStateContainer_1.DurableEntityStateContainer.isAccessAllowed(stateContainer, callingUser)) {
                    context.res = {
                        body: {
                            version: stateContainer.__metadata.version,
                            state: stateContainer.state
                        }
                    };
                }
                else {
                    context.res = { status: 403 };
                }
            }
        }
    });
}
exports.default = default_1;
;
//# sourceMappingURL=index.js.map