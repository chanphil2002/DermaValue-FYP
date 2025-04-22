import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
dotenv.config();

// Scopes define what access is being requested
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'src', 'util', 'google-calendar', 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'src', 'util', 'google-calendar', 'credentials.json');

export const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_CALLBACK_URL!
  );

// You must get the access token from the user manually via OAuth2 flow,
// or use refresh_token saved in DB or .env
export async function authorizeWithTokens(access_token: string, refresh_token?: string): Promise<OAuth2Client> {
    oauth2Client.setCredentials({
      access_token,
      refresh_token,
    });
  
    return oauth2Client;
  }

// Define the structure of the available free time slots
interface FreeTimeSlot {
    start: Date;
    end: Date;
    description: string;
  }

export async function listEvents(auth: OAuth2Client): Promise<FreeTimeSlot[]> {
    // calendar_v3.Schema$Event[]
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);  // First day of the current month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of the current month
    // Convert to ISO string format
    const timeMin = startOfMonth.toISOString();
    const timeMax = endOfMonth.toISOString();

    const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
    });

    // Get the events
    const events = res.data.items || [];

    const freeTimes: FreeTimeSlot[] = [];

    // Check for free time before the first event
    const firstEventStart = new Date(events[0].start?.dateTime || events[0].start?.date || new Date());
    if (firstEventStart > startOfMonth) {
      freeTimes.push({
        start: startOfMonth,
        end: firstEventStart,
        description: `Free from ${startOfMonth.toLocaleString()} to ${firstEventStart.toLocaleString()}`,
      });
    }
  
    // Check for gaps between events
    for (let i = 0; i < events.length - 1; i++) {
      const currentEventEnd = new Date(events[i].end?.dateTime || events[i].end?.date || new Date());
      const nextEventStart = new Date(events[i + 1].start?.dateTime || events[i + 1].start?.date || new Date());
  
      // If there is a gap between events, add it to the free times list
      if (nextEventStart > currentEventEnd) {
        freeTimes.push({
          start: currentEventEnd,
          end: nextEventStart,
          description: `Free from ${currentEventEnd.toLocaleString()} to ${nextEventStart.toLocaleString()}`,
        });
      }
    }
  
    // Check for free time after the last event
    const lastEventEnd = new Date(events[events.length - 1].end?.dateTime || events[events.length - 1].end?.date || new Date());
    if (lastEventEnd < endOfMonth) {
      freeTimes.push({
        start: lastEventEnd,
        end: endOfMonth,
        description: `Free from ${lastEventEnd.toLocaleString()} to ${endOfMonth.toLocaleString()}`,
      });
    }
  
    return freeTimes;
  }
