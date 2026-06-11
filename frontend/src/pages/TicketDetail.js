import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { ticketsAPI } from '../utils/api';

export default function TicketDetail() {
  const { ticketNumber } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['ticket', ticketNumber],
    queryFn: () => ticketsAPI.getOne(ticketNumber).then((r) => r.data),
  });

  if (isLoading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (!data?.data) return <div style={{ textAlign: 'center', padding: 60 }}>Ticket not found</div>;

  const ticket = data.data;
  const { ticketNumber: num, event, tierName, quantity, total, status, qrCodeData } = ticket;

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 20px 60px' }}>
      <Link to="/my-tickets" style={{ color: 'var(--text-dim)', fontSize: 12, letterSpacing: 1 }}>← Back to My Tickets</Link>
      <div className="card" style={{ marginTop: 24, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-head)', color: 'var(--magenta)', fontSize: 13, letterSpacing: 4, marginBottom: 8 }}>◈ RESONANCE TICKET</div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, letterSpacing: 2 }}>{event?.title}</h2>
          {event?.startDate && <p style={{ color: 'var(--cyan)', fontSize: 13, marginTop: 8 }}>{format(new Date(event.startDate), 'EEEE, MMMM d, yyyy · h:mm a')}</p>}
          {event?.venue && <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>📍 {event.venue.name}, {event.venue.city}</p>}
        </div>

        <div style={{ borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[['Ticket #', num], ['Type', tierName], ['Qty', quantity], ['Total', `$${total?.toFixed(2)}`], ['Status', status.replace('_', ' ').toUpperCase()]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-dim)' }}>{k}</span>
              <span style={{ fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>

        {status === 'confirmed' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 8, display: 'inline-block', marginBottom: 8 }}>
              {qrCodeData
                ? <img src={qrCodeData} alt="QR Code" style={{ width: 180, height: 180 }} />
                : <QRCodeSVG value={JSON.stringify({ ticketNumber: num })} size={180} />
              }
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>Present at the door · Must be 18+ with valid ID</p>
          </div>
        )}
      </div>
    </div>
  );
}
