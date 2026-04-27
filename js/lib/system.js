/**
 * SYSTEM.JS - The "Discipline" Layer
 * Standardizes the lifecycle of components and state.
 */

import { renderIcons } from "./utils.js";

/**
 * Base Component Class
 */
export class Component {
  constructor(container, store = null) {
    this.container = container;
    this.store = store;
    this.unsubscribe = null;
    
    // Auto-subscribe if store provided
    if (this.store) {
      this.unsubscribe = this.store.subscribe(() => this.update());
    }
  }

  /**
   * Initial render and binding
   */
  mount() {
    this.render();
    this.afterRender();
  }

  /**
   * Standard render - should only update innerHTML
   */
  render() {
    // To be overridden
  }

  /**
   * Hydration - re-run icons, bind local events
   */
  afterRender() {
    renderIcons(this.container);
  }

  /**
   * Smart update - can be overridden for partial updates
   */
  update() {
    this.render();
    this.afterRender();
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    this.container.innerHTML = "";
  }
}

/**
 * Universal Event Delegation Helper
 * Simplifies adding event listeners to the document
 */
export function on(event, selector, handler) {
  document.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target) handler(e, target);
  });
}
