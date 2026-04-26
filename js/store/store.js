export class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Set();
  }

  // Get current state
  getState() {
    return this.state;
  }

  // Subscribe to changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener); // unsubscribe function
  }

  // Update state and notify listeners
  setState(partialState) {
    const nextState = typeof partialState === 'function' ? partialState(this.state) : partialState;
    
    // Only update and notify if there are actual changes
    let changed = false;
    for (const key in nextState) {
      if (this.state[key] !== nextState[key]) {
        changed = true;
        break;
      }
    }

    if (changed) {
      // Create new state object
      this.state = { ...this.state, ...nextState };
      // Notify listeners
      for (const listener of this.listeners) {
        listener(this.state);
      }
    }
  }
}
