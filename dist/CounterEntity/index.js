"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DurableFunctions = require("durable-functions");
const CounterEntity_1 = require("../DurableEntities/CounterEntity");
exports.default = DurableFunctions.entity((ctx) => new CounterEntity_1.CounterEntity(ctx).handleSignal());
//# sourceMappingURL=index.js.map