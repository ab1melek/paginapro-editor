#!/usr/bin/env node

/**
 * Script para verificar el endpoint /api/auth/me
 * Simula lo que hace el navegador
 */

import fetch from 'node-fetch';

async function checkMe() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        // Aquí iría la cookie de auth, pero como es un HTTP request sin contexto,
        // probablemente obtendremos { user: null }
      }
    });
    
    const data = await response.json();
    console.log('\n✅ /api/auth/me response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkMe();
