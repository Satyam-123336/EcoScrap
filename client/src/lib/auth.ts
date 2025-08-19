import { User, LoginData } from '@shared/schema';

class AuthManager {
  private currentUser: User | null = null;

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('currentUserId', user.id);
    } else {
      localStorage.removeItem('currentUserId');
    }
  }

  async login(credentials: LoginData): Promise<User> {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

  async register(userData: any): Promise<User> {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

  logout() {
    this.setCurrentUser(null);
  }

  async loadUser(): Promise<User | null> {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) return null;

    try {
      const response = await fetch(`/api/user/${userId}`);
      if (response.ok) {
        const user = await response.json();
        this.setCurrentUser(user);
        return user;
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }

    this.logout();
    return null;
  }
}

export const authManager = new AuthManager();
