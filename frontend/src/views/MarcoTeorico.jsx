import React, { useState } from 'react';
import { BookOpen, Award, Users, ShieldAlert, GraduationCap, ChevronDown, BookMarked } from 'lucide-react';

export default function MarcoTeorico() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const sections = [
    {
      title: "1. Enseñar a Pensar y Actuar sobre la Realidad",
      icon: <GraduationCap className="text-indigo-600" size={24} />,
      content: (
        <div>
          <p>
            El método didáctico propuesto se distancia de la mera transmisión de información estática. Su núcleo es incentivar al infante a 
            <strong> actuar activamente sobre los objetos y su entorno</strong>. Para Jean Piaget, el conocimiento no es una copia pasiva 
            del exterior, sino el resultado directo del andamiaje entre asimilación y acomodación frente al conflicto cognitivo.
          </p>
          <div className="quote-highlight">
            "El desarrollo cognitivo no consiste en acumular datos de memoria, sino en construir estructuras operativas mentales que le permitan al niño asimilar y transformar activamente la realidad física y social que le rodea." 
            <br />
            <span className="text-muted font-outfit" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>— Jean Piaget, Epistemología Genética</span>
          </div>
          <p style={{ marginTop: '0.75rem' }}>
            En el aula, esto se traduce en presentar láminas y tableros donde el alumno no sea un espectador, sino un investigador que categoriza, seriates y toma decisiones frente a situaciones simuladas de la vida real.
          </p>
        </div>
      )
    },
    {
      title: "2. Aprender a Aprender y Roles Didácticos",
      icon: <Users className="text-cyan-600" size={24} />,
      content: (
        <div>
          <p>
            La meta suprema de la intervención cognitiva es el desarrollo de la autonomía del estudiante. 
            El <strong>docente no provee respuestas</strong>; actúa como un <strong>mediador cognitivo</strong> que diseña desequilibrios controlados.
            Su labor principal es escuchar, observar y formular preguntas andamiadas (scaffolding) ajustadas al nivel operativo del niño.
          </p>
          <div className="quote-highlight">
            "Para que un aprendizaje sea significativo, la nueva información didáctica debe conectarse deliberadamente con los conceptos ya existentes en la estructura cognitiva del niño, de modo que altere y enriquezca su red mental anterior." 
            <br />
            <span className="text-muted font-outfit" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>— David Ausubel, Psicología Educativa Cognitiva</span>
          </div>
          <p style={{ marginTop: '0.75rem' }}>
            El rol del alumno es resolver el conflicto mediante el diálogo interactivo, construyendo sus propias hipótesis lógicas sobre la confianza de las personas y los riesgos a su alrededor.
          </p>
        </div>
      )
    },
    {
      title: "3. El Aprendizaje Basado en Problemas (ABP)",
      icon: <BookMarked className="text-purple-600" size={24} />,
      content: (
        <div>
          <p>
            El ABP proporciona el escenario vivencial idóneo. La situación didáctica gira en torno a un problema real y relevante para el niño: 
            <strong> ¿Cómo reconocer a quién confiar y cómo reaccionar ante personas peligrosas o de riesgo?</strong>
          </p>
          <p style={{ margin: '0.75rem 0' }}>
            A través de las tres variantes de clasificación (Igualdad, Semejanza, Exclusividad) y secuencias lógicas de seriación temporal, el niño desarrolla habilidades de análisis situacional, anticipación de consecuencias y juicio de seguridad.
          </p>
          <div className="quote-highlight">
            "La autorregulación y la metacognición en los niños pequeños se desarrollan a través del portafolio reflexivo, donde el estudiante planifica, ejecuta y evalúa conscientemente sus propias estrategias lógicas de clasificación." 
            <br />
            <span className="text-muted font-outfit" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>— Barry Zimmerman, Teoría del Autoaprendizaje</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="sub-view animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">Marco Teórico & Antecedentes</h1>
          <p className="section-subtitle">Fundamentos cognitivo-didácticos del método educativo (Piaget, Ausubel, Zimmerman)</p>
        </div>
        <BookOpen className="text-indigo-600" size={36} />
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="stat-icon class-grad">
            <GraduationCap size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-value" style={{ fontSize: '1.25rem' }}>Estadio Operatorio</span>
            <span className="stat-label">Pensamiento Pre-operacional y Transición (3 - 6 años)</span>
          </div>
        </div>
        
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="stat-icon student-grad">
            <Award size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-value" style={{ fontSize: '1.25rem' }}>Mediación Activa</span>
            <span className="stat-label">Andamiaje verbal y conflicto cognitivo</span>
          </div>
        </div>
      </div>

      <div className="accordion-container">
        {sections.map((sec, index) => {
          const isOpen = activeIndex === index;
          return (
            <div key={index} className="accordion-item glass">
              <button 
                className="accordion-trigger" 
                onClick={() => toggleAccordion(index)}
                style={{ borderBottom: isOpen ? '1px solid var(--glass-border)' : 'none' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {sec.icon}
                  {sec.title}
                </span>
                <ChevronDown 
                  className="text-muted" 
                  size={20} 
                  style={{ 
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                />
              </button>
              {isOpen && (
                <div className="accordion-content">
                  {sec.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="trust-strategy-card" style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <BookOpen className="text-green-600" size={32} style={{ flexShrink: 0 }} />
        <div>
          <h4 className="font-outfit text-white" style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>Sugerencia de Uso Científico:</h4>
          <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Utilice este visor teórico para refrescar los principios didácticos antes de aplicar las láminas en el simulador o de evaluar el nivel de estructuración operatoria de sus alumnos en la sección de rúbricas.
          </p>
        </div>
      </div>
    </div>
  );
}
