import * as rfc6902 from 'rfc6902';

export class EntityStateChangedMessage {
    
    entityName: string = '';
    entityKey: string = '';
    version: number = 0;
    stateDiff: rfc6902.Operation[] = [];
    isEntityDestructed: boolean = false;

    static GetEntityId(msg: EntityStateChangedMessage): string {
        return EntityStateChangedMessage.FormatEntityId(msg.entityName, msg.entityKey);
    }

    static FormatEntityId(entityName: string, entityKey: string): string {
        return `@${entityName}@${entityKey}`;
    }
}

export class EntitySignalResponseMessage {

    entityName: string = '';
    entityKey: string = '';
    correlationId: string = '';
    result: any;
    errorMessage: string = '';
}