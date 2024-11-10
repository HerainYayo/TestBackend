import AuthManager from '../manager/auth_manager';
import BroadcastManager from '../manager/broadcast_manager';
import UserManager from '../manager/user_manager';

class ModuleManager {
    public authManager: AuthManager;
    public broadcastManager: BroadcastManager;
    public userManager: UserManager;

    constructor() {
        this.authManager = new AuthManager();
        this.broadcastManager = new BroadcastManager();
        this.userManager = new UserManager();
    }
}

const moduleManagerInstance = new ModuleManager();

export {
    moduleManagerInstance,
    ModuleManager
};