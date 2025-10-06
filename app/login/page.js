"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../styles/auth.module.css';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const j = await res.json().catch(()=>({}));
      if (res.ok) router.push('/dashboard');
      else alert(j?.error || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <form onSubmit={submit} className={styles.card}>
        <div>
          <h2 className={styles.title}>Iniciar sesión</h2>
          <p className={styles.subtitle}>Accede con tu email o usuario y contraseña.</p>
        </div>
        <input className={styles.input} placeholder="email o usuario" value={identifier} onChange={e=>setIdentifier(e.target.value)} />
        <input className={styles.input} placeholder="contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className={styles.submit} disabled={loading} type="submit">{loading? 'Entrando...' : 'Entrar'}</button>
        <div className={styles.linkRow}>
          ¿No tienes cuenta? <Link className={styles.link} href="/signup">Crear cuenta</Link>
        </div>
      </form>
    </main>
  );
}
