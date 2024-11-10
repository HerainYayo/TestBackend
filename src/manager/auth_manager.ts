class AuthManager {
  public access_token: string | null;

  constructor() {
    this.access_token = null;
  }

  setAccessToken(token: string): void {
    this.access_token = token;
  }

  getAccessToken(): string | null {
    return this.access_token;
  }

}

export default AuthManager;
