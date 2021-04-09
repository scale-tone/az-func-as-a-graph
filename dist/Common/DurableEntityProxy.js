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
exports.DurableEntityProxy = void 0;
const DurableFunctions = require("durable-functions");
// Durable Entity's Proxy. Sends signals and reads your entity's state in a strongly-typed manner.
class DurableEntityProxy {
    constructor(context, entityName, entityKey) {
        this._client = DurableFunctions.getClient(context);
        this._entityId = new DurableFunctions.EntityId(entityName, entityKey);
    }
    signalEntity(operationName, argument) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._client.signalEntity(this._entityId, operationName, argument);
        });
    }
    readEntityState() {
        return __awaiter(this, void 0, void 0, function* () {
            const stateResponse = yield this._client.readEntityState(this._entityId);
            if (!stateResponse.entityExists) {
                throw new Error(this._entityId.toString() + ' doesn\'t exist');
            }
            return (!stateResponse.entityState.__metadata) ? stateResponse.entityState : stateResponse.entityState.state;
        });
    }
}
exports.DurableEntityProxy = DurableEntityProxy;
//# sourceMappingURL=DurableEntityProxy.js.map