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
    
    
    localStorage.setItem('currentUserId', user.id);
    
    
    this.setCurrentUser(user);

    setTimeout(() => {
      
      window.location.replace('/');
    }, 50);
    
    return user;
  }

  logout() {
    this.setCurrentUser(null);
  }

  async loadUser(): Promise<User | null> {
    try {
      const userId = localStorage.getItem('currentUserId');
      if (!userId) {
        this.logout();
        return null;
      }

      const response = await fetch(`/api/user/${userId}`);
      if (response.ok) {
        const user = await response.json();
        this.setCurrentUser(user);
        return user;
      } else {
        
        console.log('User not found, clearing stored session');
        this.logout();
        return null;
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      
      this.logout();
      return null;
    }
  }
}

export const authManager = new AuthManager();

