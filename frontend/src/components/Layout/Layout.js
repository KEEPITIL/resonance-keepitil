import React from 'react';
import { useLocation } from 'react-router-dom';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import './Layout.css';

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const fullscreen = ['/explore'].includes(pathname);

  return (
    <div className="app-shell">
      <DesktopNav />
      <main className={`main-content${fullscreen ? ' fullscreen' : ''}`}>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
