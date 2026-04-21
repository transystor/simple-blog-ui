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
        <Link to="/"><strong className="site-title">{settings.siteTitle}</strong></Link>
        <div className="row">
          <Link to="/">{settings.navigationLabel}</Link>
        </div>
      </div>
      {children}
    </div>
  );
}
