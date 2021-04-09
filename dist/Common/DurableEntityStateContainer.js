"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurableEntityStateContainer = exports.DurableEntityStateMetadata = void 0;
const DurableEntity_1 = require("./DurableEntity");
// Internal metadata stored along with entity state
class DurableEntityStateMetadata {
    constructor(visibility, owner, allowedUsers) {
        this.visibility = visibility;
        this.owner = owner;
        this.allowedUsers = allowedUsers;
        this.version = 0;
        // Adding owner to the list of allowed users
        if (this.visibility === DurableEntity_1.VisibilityEnum.ToListOfUsers && !this.allowedUsers && !!this.owner) {
            this.allowedUsers = [this.owner];
        }
    }
    // Checks if a given user has access to this entity
    static isAccessAllowed(stateMetadata, user) {
        switch (stateMetadata.visibility) {
            case DurableEntity_1.VisibilityEnum.ToOwnerOnly:
                if (!stateMetadata.owner || stateMetadata.owner !== user) {
                    return false;
                }
                return true;
            case DurableEntity_1.VisibilityEnum.ToListOfUsers:
                if (!stateMetadata.allowedUsers || !stateMetadata.allowedUsers.includes(user)) {
                    return false;
                }
                return true;
            case DurableEntity_1.VisibilityEnum.ToEveryone:
                return true;
            default:
                // Should always return false here, to prevent accidental exposure of external entities
                return false;
        }
    }
}
exports.DurableEntityStateMetadata = DurableEntityStateMetadata;
// A wrapper around entity's state, with some extra metadata added
class DurableEntityStateContainer {
    constructor(state, visibility, owner, allowedUsers) {
        this.state = state;
        this.__metadata = new DurableEntityStateMetadata(visibility, owner, allowedUsers);
    }
    // Checks if a given user has access to this entity
    static isAccessAllowed(stateContainer, user) {
        if (!stateContainer.__metadata) {
            return false;
        }
        return DurableEntityStateMetadata.isAccessAllowed(stateContainer.__metadata, user);
    }
}
exports.DurableEntityStateContainer = DurableEntityStateContainer;
//# sourceMappingURL=DurableEntityStateContainer.js.map