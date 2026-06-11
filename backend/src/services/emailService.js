const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'noreply@resonanceevents.com',
  name: process.env.SENDGRID_FROM_NAME || 'RESONANCE',
};

// ── Base send helper ──────────────────────────────────────────────────────────
const send = async (to, subject, html, text) => {
  try {
    await sgMail.send({ to, from: FROM, subject, html, text: text || '' });
  } catch (err) {
    console.error('SendGrid error:', err?.response?.body?.errors || err.message);
  }
};

// ── HTML wrapper with RESONANCE brand ─────────────────────────────────────────
const wrap = (body) => `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{margin:0;padding:0;background:#0A0A0A;font-family:'Space Mono',monospace;color:#fff}
  .container{max-width:600px;margin:0 auto;padding:40px 20px}
  .header{text-align:center;padding:30px 0;border-bottom:2px solid #CC0088}
  .logo{font-family:'Orbitron',sans-serif;font-size:28px;color:#CC0088;letter-spacing:4px}
  .tagline{color:#00FFFF;font-size:12px;letter-spacing:2px}
  .content{padding:30px 0;line-height:1.7;font-size:14px}
  .btn{display:inline-block;padding:14px 32px;background:#CC0088;color:#fff;text-decoration:none;
       border-radius:4px;font-weight:bold;margin:20px 0;letter-spacing:1px}
  .ticket-box{background:#1A0A1A;border:1px solid #CC0088;border-radius:8px;padding:20px;margin:20px 0}
  .footer{border-top:1px solid #333;padding:20px 0;text-align:center;color:#666;font-size:12px}
  h2{color:#CC0088;font-family:'Orbitron',sans-serif;letter-spacing:2px}
  .cyan{color:#00FFFF} .magenta{color:#CC0088} .purple{color:#9900FF}
</style></head><body>
<div class="container">
  <div class="header">
    <div class="logo">◈ RESONANCE ◈</div>
    <div class="tagline">EDM EVENTS · DJ BOOKING · CALIFORNIA</div>
  </div>
  <div class="content">${body}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} RESONANCE · California, USA · 18+ Events</p>
    <p>You received this because you have an account with RESONANCE.</p>
  </div>
</div></body></html>`;

// ── Email templates ───────────────────────────────────────────────────────────

const sendTicketConfirmation = async (to, { ticketNumber, eventTitle, eventDate, venueName, tierName, quantity, total, qrCodeUrl }) => {
  const body = `
    <h2>🎵 TICKET CONFIRMED</h2>
    <p>Your tickets are locked in. See you on the dancefloor.</p>
    <div class="ticket-box">
      <p><span class="cyan">Ticket #</span> ${ticketNumber}</p>
      <p><span class="cyan">Event:</span> ${eventTitle}</p>
      <p><span class="cyan">Date:</span> ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p><span class="cyan">Venue:</span> ${venueName}</p>
      <p><span class="cyan">Tier:</span> ${tierName} × ${quantity}</p>
      <p><span class="cyan">Total Paid:</span> $${total.toFixed(2)}</p>
    </div>
    ${qrCodeUrl ? `<p style="text-align:center"><img src="${qrCodeUrl}" width="200" style="border:2px solid #CC0088;padding:8px;background:#fff" /></p>` : ''}
    <p style="color:#999;font-size:12px">Present your QR code at the door. Must be 18+ with valid ID.</p>`;
  await send(to, `🎵 Your RESONANCE Tickets — ${eventTitle}`, wrap(body));
};

const sendBookingRequest = async (to, { djName, organizerName, eventTitle, proposedFee, performanceDate, bookingRef }) => {
  const body = `
    <h2>📩 NEW BOOKING REQUEST</h2>
    <p>Hey ${djName}, you've received a booking inquiry on RESONANCE.</p>
    <div class="ticket-box">
      <p><span class="cyan">Booking Ref:</span> ${bookingRef}</p>
      <p><span class="cyan">Organizer:</span> ${organizerName}</p>
      <p><span class="cyan">Event:</span> ${eventTitle || 'TBD'}</p>
      <p><span class="cyan">Date:</span> ${performanceDate ? new Date(performanceDate).toLocaleDateString() : 'TBD'}</p>
      <p><span class="cyan">Proposed Fee:</span> $${proposedFee.toLocaleString()}</p>
    </div>
    <p><a class="btn" href="${process.env.CLIENT_URL}/dashboard/bookings/${bookingRef}">REVIEW REQUEST</a></p>`;
  await send(to, `📩 New Booking Request — ${bookingRef}`, wrap(body));
};

const sendBookingConfirmation = async (to, { djName, organizerName, eventTitle, agreedFee, performanceDate, bookingRef }) => {
  const body = `
    <h2>✅ BOOKING CONFIRMED</h2>
    <p>The booking has been accepted by ${djName}.</p>
    <div class="ticket-box">
      <p><span class="cyan">Booking Ref:</span> ${bookingRef}</p>
      <p><span class="cyan">DJ:</span> ${djName}</p>
      <p><span class="cyan">Event:</span> ${eventTitle || 'TBD'}</p>
      <p><span class="cyan">Date:</span> ${performanceDate ? new Date(performanceDate).toLocaleDateString() : 'TBD'}</p>
      <p><span class="cyan">Agreed Fee:</span> $${agreedFee.toLocaleString()}</p>
    </div>
    <p><a class="btn" href="${process.env.CLIENT_URL}/dashboard/bookings/${bookingRef}">VIEW BOOKING</a></p>`;
  await send(to, `✅ Booking Confirmed — ${djName} for ${eventTitle}`, wrap(body));
};

const sendWelcomeEmail = async (to, { firstName, role }) => {
  const body = `
    <h2>WELCOME TO RESONANCE</h2>
    <p>Hey ${firstName || 'there'}, you're in.</p>
    <p>RESONANCE is California's premier EDM ticketing and DJ booking marketplace.
    ${role === 'dj' ? 'Your DJ profile is ready to customize — add your music, set your rates, and start getting booked.' :
      role === 'organizer' ? 'Start creating events and booking DJs from our marketplace.' :
      'Discover upcoming events, buy tickets, and find your next favorite DJ.'}
    </p>
    <a class="btn" href="${process.env.CLIENT_URL}/dashboard">GET STARTED</a>`;
  await send(to, '◈ Welcome to RESONANCE', wrap(body));
};

const sendPasswordReset = async (to, { resetUrl }) => {
  const body = `
    <h2>PASSWORD RESET</h2>
    <p>Someone requested a password reset for your RESONANCE account. If this wasn't you, ignore this email.</p>
    <p><a class="btn" href="${resetUrl}">RESET PASSWORD</a></p>
    <p style="color:#999;font-size:12px">This link expires in 10 minutes.</p>`;
  await send(to, 'RESONANCE — Password Reset', wrap(body));
};

// ── Waitlist notification (Eventbrite feature) ───────────────────────────────
const sendWaitlistNotification = async ({ email, name, event }) => {
  const eventUrl = `${process.env.CLIENT_URL}/events/${event.slug || event._id}`;
  const body = `
    <h2>🎉 TICKETS AVAILABLE</h2>
    <p>Hey ${name}, great news — tickets are now available for an event you joined the waitlist for.</p>
    <div class="ticket-box">
      <p><strong class="cyan">EVENT</strong> &nbsp; ${event.title}</p>
      <p><strong class="cyan">DATE</strong> &nbsp; ${event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'See event page'}</p>
      ${event.venue?.city ? `<p><strong class="cyan">CITY</strong> &nbsp; ${event.venue.city}, CA</p>` : ''}
    </div>
    <p>Act fast — these may go quickly.</p>
    <a class="btn" href="${eventUrl}">GET TICKETS NOW</a>
    <p style="color:#999;font-size:12px">You were notified because you joined the waitlist on RESONANCE.</p>`;
  await send(email, `RESONANCE — Tickets available: ${event.title}`, wrap(body));
};

// ── Kickback earnings notification ───────────────────────────────────────────
const sendKickbackEarningsUpdate = async (to, { name, code, eventTitle, uses, earnings, balance }) => {
  const body = `
    <h2>💰 KICKBACK UPDATE</h2>
    <p>Hey ${name}, your referral code <strong class="magenta">${code}</strong> just earned you more RESONANCE Kickback.</p>
    <div class="ticket-box">
      <p><strong class="cyan">EVENT</strong> &nbsp; ${eventTitle}</p>
      <p><strong class="cyan">CODE USES</strong> &nbsp; ${uses}</p>
      <p><strong class="cyan">THIS EARNING</strong> &nbsp; $${earnings.toFixed(2)}</p>
      <p><strong class="cyan">PENDING BALANCE</strong> &nbsp; $${balance.toFixed(2)}</p>
    </div>
    <p>Kickback earnings are paid out monthly to your connected Stripe account.</p>`;
  await send(to, `RESONANCE — You earned $${earnings.toFixed(2)} in Kickback`, wrap(body));
};

module.exports = {
  sendTicketConfirmation,
  sendBookingRequest,
  sendBookingConfirmation,
  sendWelcomeEmail,
  sendPasswordReset,
  sendWaitlistNotification,
  sendKickbackEarningsUpdate,
};
