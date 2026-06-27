import { User, LoginData } from "@shared/schema";

class AuthManager {
  private currentUser: User | null = null;

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
  }

  /**
   * Login — server establishes a session cookie; no localStorage needed.
   * BUG-04 fix: authentication is now fully session-based.
   */
  async login(credentials: LoginData): Promise<User> {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",         // send/receive cookies
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const user = await response.json();
    this.setCurrentUser(user);
    return user;
  }

  /**
   * Register — server establishes a session cookie immediately.
   * BUG-04 fix: no localStorage userId storage.
   */
  async register(userData: any): Promise<User> {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",         // send/receive cookies
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const user = await response.json();
    this.setCurrentUser(user);
    return user;
  }

  /**
   * Logout — destroys the server-side session.
   * BUG-04 fix: calls /api/logout instead of just clearing localStorage.
   */
  async logout(): Promise<void> {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      this.setCurrentUser(null);
    }
  }

  /**
   * Load current user from session via /api/me.
   * BUG-04 fix: no more localStorage userId; session cookie is used by the browser automatically.
   * BUG-16 fix: network errors no longer permanently log the user out.
   */
  async loadUser(): Promise<User | null> {
    try {
      const response = await fetch("/api/me", {
        credentials: "include",
      });

      if (response.ok) {
        const user = await response.json();
        this.setCurrentUser(user);
        return user;
      }

      // 401 = genuinely unauthenticated, clear state
      if (response.status === 401) {
        this.setCurrentUser(null);
        return null;
      }

      // Any other error (5xx, network issue) — don't clear user to avoid
      // logging out on temporary server hiccup (BUG-16 fix)
      console.warn(`/api/me returned ${response.status} — keeping existing session state`);
      return this.currentUser;
    } catch (error) {
      // True network failure — preserve existing state rather than forcing logout
      console.error("Network error loading user:", error);
      return this.currentUser;
    }
  }
}

export const authManager = new AuthManager();
