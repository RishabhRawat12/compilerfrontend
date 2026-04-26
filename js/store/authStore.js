import { Store } from "./store.js";
import { api, tokenStorage } from "../lib/api.js";

class AuthStore extends Store {
  constructor() {
    super({
      isAuthenticated: true,
      token: "demo-token",
      user: { username: "Guest User" }
    });
  }

  hydrate() {
    const token = tokenStorage.get();
    if (token) {
      this.setState({ isAuthenticated: true, token });
    }
  }

  async login(email, password) {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      
      const token = data.token;
      if (token) {
        tokenStorage.set(token);
        this.setState({ isAuthenticated: true, token });
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  async signup(username, email, password) {
    try {
      const { data } = await api.post("/api/auth/signup", { username, email, password });
      
      const token = data.token;
      if (token) {
        tokenStorage.set(token);
        this.setState({ isAuthenticated: true, token });
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  logout() {
    tokenStorage.clear();
    this.setState({ isAuthenticated: false, token: null, user: null });
    window.location.hash = "#/auth";
  }
}

export const authStore = new AuthStore();
