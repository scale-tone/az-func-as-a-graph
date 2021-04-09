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
exports.CounterEntity = void 0;
const DurableEntity_1 = require("../Common/DurableEntity");
const CounterState_1 = require("../ui/src/shared/CounterState");
// Sample counter entity
class CounterEntity extends DurableEntity_1.DurableEntity {
    // This method is async just to demonstrate, that your entity does can have both sync and async methods
    add(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.history.unshift(this.state.countContainer.count);
            this.state.history.splice(10, 1);
            this.state.countContainer.count += value;
        });
    }
    substract(value) {
        this.state.history.unshift(this.state.countContainer.count);
        this.state.history.splice(10, 1);
        this.state.countContainer.count -= value;
    }
    // Overriding visibility
    get visibility() { return DurableEntity_1.VisibilityEnum.ToEveryone; }
    // Custom state initialization for a newly created entity
    initializeState() {
        var newState = new CounterState_1.CounterState();
        newState.countContainer.count = 1;
        newState.title = `Counter-${new Date().toISOString()}`;
        return newState;
    }
}
exports.CounterEntity = CounterEntity;
//# sourceMappingURL=CounterEntity.js.map