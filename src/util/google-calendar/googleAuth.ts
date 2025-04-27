import { google } from 'googleapis';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import process from 'process';
import prisma from '../prisma'; // Adjust the import based on your project structure
dotenv.config();

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_CALLBACK_URL!
);

export async function getOAuth2Client(userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { clinician: true },
  });

  if (!user || !user.clinician || !user.googleAccessToken || !user.googleRefreshToken) {
    throw new Error("Clinician Google credentials not found");
  }

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  // Check if access token is still valid or refresh if needed
  try {
    await oauth2Client.getAccessToken(); // This will refresh if expired
  } catch (err) {
    console.error("Failed to get access token", err);
    throw new Error("Google authentication failed");
  }

  console.log("OAuth2 client set up successfully for user:", userEmail);

  // Save updated tokens if they have changed (auto refresh will do this)
  const { credentials } = oauth2Client;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      googleAccessToken: credentials.access_token,
      googleRefreshToken: credentials.refresh_token ?? user.googleRefreshToken, // fallback if unchanged
    },
  });

  console.log("Updated OAuth2 client credentials for user:", userEmail);

  return oauth2Client;
}

// Generate login URL
export const generateAuthUrl = (): string => {
  console.log(process.env.GOOGLE_CALLBACK_URL!);

  const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'openid',
    'profile',
    'email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
};

// Handle Google callback logic
export const handleGoogleCallback = async (code: string) => {
  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
  });

  console.log(process.env.GOOGLE_CALLBACK_URL!);

  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
  const { data: profile } = await oauth2.userinfo.get();

  if (!profile.email) {
    throw new Error("Missing profile email");
  }

  let user = await prisma.user.findUnique({ where: { email: profile.email } });
  if (!user) throw new Error("User not found");

  user = await prisma.user.update({
    where: { email: profile.email },
    data: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      isGoogleCalendarConnected: true,
    },
  });

  return { profile, tokens, user };
};