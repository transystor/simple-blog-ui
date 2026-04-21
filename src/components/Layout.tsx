import { Link } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import type { SiteSettings } from '../types';

export function Layout({ children, settings }: PropsWithChildren<{ settings?: SiteSettings | null }>) {
  if (!settings) {
    return <div className="container">{children}</div>;
  }

  return (
    <div className="container">
      <div className="nav nav-left">
        <Link to="/"><strong className="site-title">{settings.siteTitle}</strong></Link>
        <Link to="/" className="nav-label">{settings.navigationLabel}</Link>
      </div>
      {children}
    </div>
  );
}
