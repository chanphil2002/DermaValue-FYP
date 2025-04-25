import { google } from 'googleapis';
import { getOAuth2Client } from "../util/google-calendar/googleAuth";     // Import the OAuth2 client utility
import { FreeTimeSlot } from '../util/google-calendar/types';
import { OAuth2Client } from 'google-auth-library';  // Import OAuth2Client type
import { start } from 'node:repl';

export async function getClinicGoogleCalendarAvailability(clinic: any) {
  const clinicianEmails = clinic.clinicians.map((c: any) => c.user.email);
  const auth = await getOAuth2Client(clinicianEmails[0])  

  const calendar = google.calendar({ version: 'v3', auth });
  
  const allAvailableSlots: FreeTimeSlot[] = [];
  
    // Iterate over each clinician and get their calendar availability
    for (const clinician of clinic.clinicians) {
      const oauth2Client = await getOAuth2Client(clinician.user.email);
  
      // Get free time slots for the clinician using listEvents function
      const freeTimeSlots = await listEvents(oauth2Client, clinician.user.email);
  
      // Combine the clinician's available slots
      allAvailableSlots.push(...freeTimeSlots);
    }
  
    return allAvailableSlots;
  }

export async function listEvents(auth: OAuth2Client, clinicianEmail: string): Promise<FreeTimeSlot[]> {
    const calendar = google.calendar({ version: 'v3', auth });
  
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    console.log(startOfMonth, endOfMonth, clinicianEmail);
  
    const timeMin = startOfMonth.toISOString();
    const timeMax = endOfMonth.toISOString();

    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: startOfMonth.toISOString(),
        timeMax: endOfMonth.toISOString(),
        timeZone: "Asia/Kuala_Lumpur",
        items: [{ id: clinicianEmail }],
      },
    });
  
    const busySlots = res.data.calendars?.[clinicianEmail]?.busy || [];

    console.log("Busy slots:", busySlots);

    const freeSlots: FreeTimeSlot[] = [];

    let current = startOfMonth;
  
    for (const busy of busySlots) {
      const busyStart = new Date(busy.start!);
      const busyEnd = new Date(busy.end!);
  
      if (busyStart > current) {
        freeSlots.push({
          start: current,
          end: busyStart,
          description: `Free from ${current.toLocaleString()} to ${busyStart.toLocaleString()}`,
          clinician: clinicianEmail,
        });
      }
  
      current = busyEnd > current ? busyEnd : current;
    }
  
    if (current < endOfMonth) {
      freeSlots.push({
        start: current,
        end: endOfMonth,
        description: `Free from ${current.toLocaleString()} to ${endOfMonth.toLocaleString()}`,
        clinician: clinicianEmail,
      });
    }

    console.log(freeSlots);
  
    return freeSlots;
  }
