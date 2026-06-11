import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { ticketsAPI } from '../utils/api';
import './MyTickets.css';

const STATUS_COLOR = {
  confirmed: 'var(--cyan)',
  checked_in: 'var(--magenta)',
  pending: 'var(--orange)',
  cancelled: '#555',
  refunded: '#555',
};

export default function MyTickets() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => ticketsAPI.getMy().then((r) => r.data),
  });

  const tickets = data?.data || [];
  const upcoming = tickets.filter((t) => t.event && new Date(t.event.startDate) >= new Date());
  const past = tickets.filter((t) => t.event && new Date(t.event.startDate) < new Date());

  if (isLoading) return <div className="spinner" style={{ marginTop: 80 }} />;

  return (
    <div className="my-tickets-page page-container">
      <div className="page-header">
        <h1 style={{ fontFamily: 'var(--font-head)', letterSpacing: 4 }}>◈ MY TICKETS</h1>
        <p className="text-dim">{tickets.length} total ticket{tickets.length !== 1 ? 's' : ''}</p>
      </div>

      {tickets.length === 0 ? (
        <div className="tickets-empty">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎟</div>
          <h3>No tickets yet</h3>
          <p>Discover upcoming events and grab your tickets.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Events</Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="tickets-section">
              <h2 className="tickets-section__title">Upcoming</h2>
              <div className="tickets-grid">
                {upcoming.map((ticket) => <TicketCard key={ticket._id} ticket={ticket} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section className="tickets-section">
              <h2 className="tickets-section__title">Past Events</h2>
              <div className="tickets-grid">
                {past.map((ticket) => <TicketCard key={ticket._id} ticket={ticket} past />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TicketCard({ ticket, past }) {
  const { ticketNumber, event, tierName, quantity, total, status, qrCodeData } = ticket;

  return (
    <div className={`ticket-card${past ? ' past' : ''}`}>
      {/* Event cover strip */}
      {event?.coverImage && (
        <div className="ticket-card__cover">
          <img src={event.coverImage} alt={event.title} />
          <div className="ticket-card__cover-overlay" />
        </div>
      )}

      <div className="ticket-card__body">
        <div className="ticket-card__status" style={{ color: STATUS_COLOR[status] || '#fff' }}>
          ● {status.replace('_', ' ').toUpperCase()}
        </div>

        <div className="ticket-card__event">
          <Link to={`/events/${event?.slug}`} className="ticket-card__event-title">
            {event?.title}
          </Link>
          {event?.startDate && (
            <div className="ticket-card__date text-cyan">
              {format(new Date(event.startDate), 'EEE, MMM d, yyyy · h:mm a')}
            </div>
          )}
          {event?.venue && (
            <div className="ticket-card__venue text-dim">
              📍 {event.venue.name}, {event.venue.city}
            </div>
          )}
        </div>

        <div className="ticket-card__info">
          <div className="ticket-info-row"><span>Ticket #</span><span className="text-magenta">{ticketNumber}</span></div>
          <div className="ticket-info-row"><span>Type</span><span>{tierName}</span></div>
          <div className="ticket-info-row"><span>Quantity</span><span>{quantity}</span></div>
          <div className="ticket-info-row"><span>Total Paid</span><span>${total?.toFixed(2)}</span></div>
        </div>

        {/* QR Code */}
        {status === 'confirmed' && !past && (
          <div className="ticket-card__qr">
            {qrCodeData ? (
              <img src={qrCodeData} alt="QR Code" style={{ width: 120, height: 120 }} />
            ) : (
              <QRCodeSVG
                value={JSON.stringify({ ticketNumber })}
                size={120}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
              />
            )}
            <p className="text-dim" style={{ fontSize: 10, textAlign: 'center', marginTop: 6 }}>Show at door</p>
          </div>
        )}

        {status === 'checked_in' && (
          <div className="ticket-checked-in">✓ CHECKED IN</div>
        )}
      </div>
    </div>
  );
}
