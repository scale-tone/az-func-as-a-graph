
import * as DurableFunctions from "durable-functions"
import { CounterEntity } from '../DurableEntities/CounterEntity';
export default DurableFunctions.entity((ctx) => new CounterEntity(ctx).handleSignal());
        