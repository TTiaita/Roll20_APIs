class StateHandler {
    // Returns the stored value or null if module or key do not exist
    static read(module, key) {
        if (this.moduleExists(module) && this.keyExists(module, key)) {
            return state[module.toLowerCase()][key.toLowerCase()];
        }
        return null;
    }

    // Creates or updates the stored value
    static write(module, key, value) {
        this.initModule(module)
        state[module.toLowerCase()][key.toLowerCase()] = value;
    }

    // Creates a module if it does not already exist
    static initModule(module) {
        if (!this.moduleExists(module.toLowerCase())) {
            state[module.toLowerCase()] = {};
        }
    }

    // Returns true if the specified module exists
    static moduleExists(module) {
        return state.hasOwnProperty(module.toLowerCase());
    }

    // Returns true if the specified module and key exists
    static keyExists(module, key) {
        return this.moduleExists && state[module.toLowerCase()].hasOwnProperty(key.toLowerCase());
    }
}