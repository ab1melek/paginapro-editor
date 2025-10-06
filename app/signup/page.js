"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../styles/auth.module.css';

export default function SignupPage() {
  const [email, setE] = useState('');
  const [password, setP] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
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
          <h2 className={styles.title}>Crear cuenta</h2>
          <p className={styles.subtitle}>Regístrate con tu correo electrónico.</p>
        </div>
        <input className={styles.input} placeholder="email" type="email" value={email} onChange={e=>setE(e.target.value)} />
        <input className={styles.input} placeholder="contraseña" type="password" value={password} onChange={e=>setP(e.target.value)} />
        <button className={styles.submit} disabled={loading} type="submit">{loading? 'Creando...' : 'Crear'}</button>
        <div className={styles.linkRow}>
          ¿Ya tienes cuenta? <Link className={styles.link} href="/login">Iniciar sesión</Link>
        </div>
      </form>
    </main>
  );
}
