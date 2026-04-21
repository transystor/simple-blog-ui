import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/auth';
import { api } from '../lib/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('ChangeMe123!');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await api.login(email, password);
      auth.setToken(result.accessToken);
      navigate('/admin');
    } catch {
      setError('Login failed');
    }
  }

  return (
    <form className="card stack" onSubmit={onSubmit}>
      <h1>Admin login</h1>
      <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      <button className="button" type="submit">Login</button>
    </form>
  );
}
