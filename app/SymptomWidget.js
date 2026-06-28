'use client';
import { useState } from 'react';

export default function SymptomWidget({ todayDate, alreadyLogged }) {
  const [logged, setLogged] = useState(alreadyLogged);

  const logSymptom = async (score) => {
    setLogged(true);
    try {
      await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayDate, score })
      });
    } catch(e) {
      console.error(e);
    }
  };

  if (logged) return <div className="card" style={{textAlign: 'center', padding: '1.5rem'}}>Thanks for logging today! Over time, your symptoms will be graphed below.</div>;

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginTop: 0, textAlign: 'center', color: 'var(--text-color)' }}>How are your allergies today?</h3>
      <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '2.5rem', cursor: 'pointer', marginTop: '1rem' }}>
        <span onClick={() => logSymptom(1)} title="Feeling Good" style={{ transition: 'transform 0.2s' }} onMouseEnter={(e)=>e.target.style.transform='scale(1.2)'} onMouseLeave={(e)=>e.target.style.transform='scale(1)'}>😊</span>
        <span onClick={() => logSymptom(2)} title="Slightly Bothersome" style={{ transition: 'transform 0.2s' }} onMouseEnter={(e)=>e.target.style.transform='scale(1.2)'} onMouseLeave={(e)=>e.target.style.transform='scale(1)'}>😐</span>
        <span onClick={() => logSymptom(3)} title="Terrible" style={{ transition: 'transform 0.2s' }} onMouseEnter={(e)=>e.target.style.transform='scale(1.2)'} onMouseLeave={(e)=>e.target.style.transform='scale(1)'}>🤧</span>
      </div>
    </div>
  );
}
