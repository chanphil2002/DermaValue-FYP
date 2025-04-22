async function getClinicGoogleCalendarAvailability(clinic: any) {
    const allAvailableSlots = [];
  
    // Iterate over each clinician and get their calendar availability
    for (const clinician of clinic.clinicians) {
      const oauth2Client = await getOAuth2Client(clinician.user.email);
  
      // Get free time slots for the clinician using listEvents function
      const freeTimeSlots = await listEvents(oauth2Client);
  
      // Combine the clinician's available slots
      allAvailableSlots.push(...freeTimeSlots);
    }
  
    return allAvailableSlots;
  }