import { Link } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import type { SiteSettings } from '../types';

const defaultSettings: SiteSettings = {
  siteTitle: 'Simple Blog',
  navigationLabel: 'Blog',
  updatedAt: new Date(0).toISOString()
};

export function Layout({ children, settings }: PropsWithChildren<{ settings?: SiteSettings | null }>) {
  const site = settings ?? defaultSettings;

  return (
    <div className="container">
      <div className="nav">
        <Link to="/"><strong>{site.siteTitle}</strong></Link>
        <div className="row">
          <Link to="/">{site.navigationLabel}</Link>
        </div>
      </div>
      {children}
    </div>
  );
}
