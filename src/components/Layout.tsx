import { Link } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="container">
      <div className="nav">
        <Link to="/"><strong>Simple Blog</strong></Link>
        <div className="row">
          <Link to="/">Blog</Link>
          <Link to="/admin">Admin</Link>
        </div>
      </div>
      {children}
    </div>
  );
}
