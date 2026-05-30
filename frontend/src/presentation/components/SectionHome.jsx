/**
 * SectionHome — Pantalla de inicio de una sección principal.
 * Muestra tarjetas de navegación hacia subsecciones.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} props.title - Título principal
 * @param {string} props.subtitle - Subtítulo
 * @param {React.ReactNode} props.icon - Ícono principal
 * @param {Array} props.cards - [{ id, icon, title, description, badge, color }]
 * @param {Function} props.onSelect - (id) => void
 * @param {React.ReactNode} [props.extraContent] - Contenido adicional debajo de las tarjetas
 */
export default function SectionHome({ title, subtitle, icon, cards, onSelect, extraContent }) {
  return (
    <div className="animate-slide-up" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Navigation cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '1rem',
        marginBottom: extraContent ? '2rem' : 0
      }}>
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => onSelect(card.id)}
            style={{
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
              padding: '1.5rem', borderRadius: '18px', cursor: 'pointer',
              border: `1.5px solid ${card.color ? card.color + '25' : 'rgba(148,163,184,0.15)'}`,
              background: card.color ? `${card.color}08` : 'rgba(248,250,252,0.7)',
              textAlign: 'left', transition: 'all 0.2s',
              position: 'relative', overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${card.color || '#4f46e5'}18`;
              e.currentTarget.style.borderColor = `${card.color || '#4f46e5'}45`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = `${card.color || 'rgba(148,163,184,0.15)'}25`;
            }}
          >
            {/* Badge */}
            {card.badge !== undefined && (
              <span style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: card.color ? `${card.color}18` : 'rgba(79,70,229,0.1)',
                color: card.color || 'var(--accent-primary)',
                borderRadius: '999px', padding: '0.1rem 0.55rem',
                fontSize: '0.72rem', fontWeight: 700
              }}>{card.badge}</span>
            )}

            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: '12px',
              background: card.color ? `${card.color}14` : 'rgba(79,70,229,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: card.color || 'var(--accent-primary)', flexShrink: 0
            }}>
              {card.icon}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 0.3rem', fontWeight: 700, color: 'var(--text-white)', fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>
                {card.title}
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {card.description}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', color: card.color || 'var(--accent-primary)', opacity: 0.7 }}>
              <ChevronRight size={16} />
            </div>
          </button>
        ))}
      </div>

      {extraContent}
    </div>
  );
}
