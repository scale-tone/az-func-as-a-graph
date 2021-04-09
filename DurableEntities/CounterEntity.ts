
import { DurableEntity, VisibilityEnum } from '../Common/DurableEntity';
import { CounterState } from '../ui/src/shared/CounterState';

// Sample counter entity
export class CounterEntity extends DurableEntity<CounterState>
{
    // This method is async just to demonstrate, that your entity does can have both sync and async methods
    async add(value: number) {
        this.state.history.unshift(this.state.countContainer.count);
        this.state.history.splice(10, 1);

        this.state.countContainer.count += value;
    }

    substract(value: number) {
        this.state.history.unshift(this.state.countContainer.count);
        this.state.history.splice(10, 1);

        this.state.countContainer.count -= value;
    }

    // Overriding visibility
    protected get visibility(): VisibilityEnum { return VisibilityEnum.ToEveryone; }

    // Custom state initialization for a newly created entity
    protected initializeState(): CounterState {

        var newState = new CounterState();

        newState.countContainer.count = 1;
        newState.title = `Counter-${new Date().toISOString()}`;

        return newState;
    }
}
