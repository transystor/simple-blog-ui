import { Link } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import type { SiteSettings } from '../types';

function getHeaderLinkTarget(type: 'url' | 'tag', value: string) {
  return type === 'tag' ? `/?tag=${encodeURIComponent(value)}` : (value || '/');
}

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
          {[...settings.headerLinks].sort((a, b) => a.priority - b.priority).reverse().map((link, index) => (
            <Link key={`${link.label}-${index}`} to={getHeaderLinkTarget(link.type, link.value)} className="nav-label">{link.label}</Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
