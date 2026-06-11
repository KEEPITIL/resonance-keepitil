import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsAPI, eventsAPI } from '../utils/api';
import { format } from 'date-fns';
import './Dashboard.css';

export default function Dashboard() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['organizer-analytics'],
    queryFn: () => analyticsAPI.organizer().then((r) => r.data),
  });

  const analytics = analyticsData?.data;

  const statCards = [
    { label: 'Total Revenue', value: analytics?.totals?.totalRevenue ? `$${analytics.totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00', color: 'var(--magenta)' },
    { label: 'Tickets Sold', value: analytics?.totals?.totalTicketsSold?.toLocaleString() || '0', color: 'var(--cyan)' },
    { label: 'Active Events', value: analytics?.events?.filter((e) => e.status === 'published').length || 0, color: 'var(--purple)' },
    { label: 'Platform Fees', value: analytics?.totals?.totalPlatformFees ? `$${analytics.totals.totalPlatformFees.toFixed(2)}` : '$0.00', color: 'var(--orange)' },
  ];

  return (
    <div className="dashboard page-container">
      <div className="dashboard__header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', letterSpacing: 3 }}>ORGANIZER DASHBOARD</h1>
          <p className="text-dim">Manage your events and track revenue</p>
        </div>
        <Link to="/events/create" className="btn btn-primary">+ Create Event</Link>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card card">
            <div className="stat-card__label">{s.label}</div>
            <div className="stat-card__value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Sales chart */}
      {analytics?.salesOverTime?.length > 0 && (
        <div className="dashboard-chart card">
          <h3 className="dashboard-section-title">Sales — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analytics.salesOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#CC0088" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#CC0088" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A0A1A" />
              <XAxis dataKey="_id" tick={{ fill: '#666', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #CC0088', borderRadius: 6, fontFamily: 'Space Mono' }} formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
              <Area type="monotone" dataKey="sales" stroke="#CC0088" strokeWidth={2} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Events list */}
      <div className="dashboard-events">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="dashboard-section-title">Your Events</h3>
        </div>

        {isLoading ? <div className="spinner" /> : analytics?.events?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            <p>No events yet. <Link to="/events/create">Create your first event →</Link></p>
          </div>
        ) : (
          <div className="events-table">
            <div className="events-table__head">
              <span>Event</span><span>Date</span><span>Status</span><span>Sold</span><span>Revenue</span><span></span>
            </div>
            {(analytics?.events || []).map((event) => (
              <div key={event._id} className="events-table__row">
                <span className="event-table-title">{event.title}</span>
                <span className="text-dim" style={{ fontSize: 12 }}>{format(new Date(event.startDate), 'MMM d, yyyy')}</span>
                <span>
                  <span className={`badge ${event.status === 'published' ? 'badge-live' : ''}`} style={event.status === 'draft' ? { background: 'rgba(100,100,100,0.2)', color: '#888', border: '1px solid #333' } : {}}>
                    {event.status.toUpperCase()}
                  </span>
                </span>
                <span style={{ fontWeight: 700 }}>{event.stats?.ticketsSold || 0}</span>
                <span style={{ color: 'var(--magenta)', fontWeight: 700 }}>${(event.stats?.revenue || 0).toFixed(2)}</span>
                <span>
                  <Link to={`/events/${event._id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
