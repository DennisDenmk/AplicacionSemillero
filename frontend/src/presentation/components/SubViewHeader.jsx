/**
 * SubViewHeader — Encabezado con botón "Volver" para sub-vistas.
 */
import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function SubViewHeader({ onBack, title, subtitle, icon, actions }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      marginBottom: '1.75rem', flexWrap: 'wrap'
    }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.45rem 0.9rem', borderRadius: '10px', cursor: 'pointer',
          background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)',
          color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600,
          transition: 'all 0.15s', flexShrink: 0
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.08)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.08)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <ArrowLeft size={15} /> Volver
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
        {icon && (
          <div style={{
            width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
            background: 'rgba(79,70,229,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
          }}>{icon}</div>
        )}
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-white)', fontFamily: 'Outfit, sans-serif' }}>{title}</h2>
          {subtitle && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
      </div>

      {actions && <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
