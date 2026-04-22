import { Link } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import type { SiteSettings } from '../types';

export function Layout({ children, settings }: PropsWithChildren<{ settings?: SiteSettings | null }>) {
  if (!settings) {
    return <div className="container">{children}</div>;
  }

  return (
    <div className="container">
      <div className="nav">
        <div className="nav-left">
          <Link to="/"><strong className="site-title">{settings.siteTitle}</strong></Link>
        </div>
        <div className="nav-right">
          {[...settings.headerLinks].reverse().map((link, index) => (
            <Link key={`${link.label}-${index}`} to={link.url || '/'} className="nav-label">{link.label}</Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
