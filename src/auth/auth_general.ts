import { Application, Request, Response } from "express";
import { google } from "googleapis";

function register(app: Application, moduleManagerInstance: any): void {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.CALLBACK_URL
  );


  app.use((req: Request, res: Response, next) => {
    if (oauth2Client.credentials.expiry_date && oauth2Client.credentials.expiry_date < Date.now()) {
      refreshAccessToken();
    }
    next();
  });

  async function refreshAccessToken() {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      console.log('new Access Token:', credentials.access_token);
      moduleManagerInstance.authManager.setAccessToken(
        credentials.access_token as string
      );
    } catch (error) {
      console.error('error:', error);
    }
  }

  app.get("/loginToGoogle", (req: Request, res: Response) => {
    const scopes = ["https://www.googleapis.com/auth/youtube"];
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent"
    });
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.redirect(url);
  });

  app.get("/oauth2callback", async (req: Request, res: Response) => {
    const { tokens } = await oauth2Client.getToken(req.query.code as string);
    oauth2Client.setCredentials(tokens);

    console.log("credentials", oauth2Client.credentials);

    moduleManagerInstance.authManager.setAccessToken(
      oauth2Client.credentials.access_token as string
    );

    res.redirect(process.env.FRONTEND_DASHBOARD as string);
  });
}

export { register };
