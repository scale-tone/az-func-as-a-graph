import { VisibilityEnum } from './DurableEntity';

// Internal metadata stored along with entity state
export class DurableEntityStateMetadata {

    version: number = 0;

    constructor(public visibility: VisibilityEnum, public owner: string, public allowedUsers?: string[]) {

        // Adding owner to the list of allowed users
        if (this.visibility === VisibilityEnum.ToListOfUsers && !this.allowedUsers && !!this.owner) {
            this.allowedUsers = [this.owner];
        }
    }

    // Checks if a given user has access to this entity
    static isAccessAllowed(stateMetadata: DurableEntityStateMetadata, user: string): boolean {

        switch (stateMetadata.visibility) {
            case VisibilityEnum.ToOwnerOnly:
                if (!stateMetadata.owner || stateMetadata.owner !== user) {
                    return false;
                }
                return true;
            case VisibilityEnum.ToListOfUsers:
                if (!stateMetadata.allowedUsers || !stateMetadata.allowedUsers.includes(user)) {
                    return false;
                }
                return true;
            case VisibilityEnum.ToEveryone:
                return true;
            default:
                // Should always return false here, to prevent accidental exposure of external entities
                return false;
        }
    }
}

// A wrapper around entity's state, with some extra metadata added
export class DurableEntityStateContainer<TState> {

    __metadata: DurableEntityStateMetadata;

    constructor(public state: TState, visibility: VisibilityEnum, owner: string, allowedUsers?: string[]) {
        this.__metadata = new DurableEntityStateMetadata(visibility, owner, allowedUsers);
    }

    // Checks if a given user has access to this entity
    static isAccessAllowed(stateContainer: DurableEntityStateContainer<any>, user: string): boolean {
        if (!stateContainer.__metadata) {
            return false;
        }
        return DurableEntityStateMetadata.isAccessAllowed(stateContainer.__metadata, user);
    }
}