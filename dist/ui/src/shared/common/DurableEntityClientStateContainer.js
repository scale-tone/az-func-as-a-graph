"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurableEntityClientStateContainer = void 0;
// A client-side wrapper around entity's state, with some extra metadata added
class DurableEntityClientStateContainer {
    constructor() {
        this.version = 0;
        this.state = {};
    }
}
exports.DurableEntityClientStateContainer = DurableEntityClientStateContainer;
//# sourceMappingURL=DurableEntityClientStateContainer.js.map