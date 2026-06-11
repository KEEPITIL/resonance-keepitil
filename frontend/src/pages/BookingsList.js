import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './BookingsList.css';

export default function BookingsList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isDJ = user?.role === 'dj';

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', isDJ ? 'dj' : 'organizer'],
    queryFn: () => (isDJ ? bookingsAPI.getDJ() : bookingsAPI.getMy()).then((r) => r.data),
  });

  const respondMutation = useMutation({
    mutationFn: ({ ref, action, agreedFee }) => bookingsAPI.respond(ref, { action, agreedFee }),
    onSuccess: () => { toast.success('Response sent'); qc.invalidateQueries(['bookings']); },
    onError: () => toast.error('Failed to respond'),
  });

  const bookings = data?.data || [];

  const STATUS_COLORS = { inquiry: '#FF6600', pending: '#FF6600', accepted: '#00FFFF', declined: '#555', cancelled: '#555', completed: '#CC0088', paid: '#9900FF' };

  return (
    <div className="bookings-page page-container">
      <div className="page-header">
        <h1 style={{ fontFamily: 'var(--font-head)', letterSpacing: 3 }}>
          {isDJ ? '📩 DJ BOOKINGS' : '🎪 MY BOOKINGS'}
        </h1>
      </div>

      {isLoading ? <div className="spinner" /> : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
          <p>No bookings yet.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking._id} className="booking-card card">
              <div className="booking-card__header">
                <span className="booking-ref text-dim">#{booking.bookingRef}</span>
                <span className="badge" style={{ background: `${STATUS_COLORS[booking.status]}22`, color: STATUS_COLORS[booking.status], border: `1px solid ${STATUS_COLORS[booking.status]}44` }}>
                  {booking.status.toUpperCase()}
                </span>
              </div>

              <div className="booking-card__body">
                <div className="booking-info">
                  {isDJ ? (
                    <div><span className="text-dim">Organizer: </span>{booking.organizer?.firstName} {booking.organizer?.lastName}</div>
                  ) : (
                    <div><span className="text-dim">DJ: </span><strong>{booking.dj?.stageName}</strong></div>
                  )}
                  <div><span className="text-dim">Proposed Fee: </span><strong className="text-magenta">${booking.proposedFee?.toLocaleString()}</strong></div>
                  {booking.agreedFee && <div><span className="text-dim">Agreed Fee: </span><strong className="text-cyan">${booking.agreedFee?.toLocaleString()}</strong></div>}
                  {booking.performanceDate && <div><span className="text-dim">Date: </span>{format(new Date(booking.performanceDate), 'MMM d, yyyy')}</div>}
                  {booking.setDuration && <div><span className="text-dim">Set: </span>{booking.setDuration} minutes</div>}
                  {booking.notes && <div><span className="text-dim">Notes: </span>{booking.notes}</div>}
                </div>

                {/* DJ actions */}
                {isDJ && booking.status === 'inquiry' && (
                  <div className="booking-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => respondMutation.mutate({ ref: booking.bookingRef, action: 'accept', agreedFee: booking.proposedFee })}>
                      Accept
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--orange)', borderColor: 'var(--orange)' }} onClick={() => respondMutation.mutate({ ref: booking.bookingRef, action: 'decline' })}>
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
