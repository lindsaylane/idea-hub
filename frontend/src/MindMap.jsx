import React, { useState } from 'react'

const VALUES = [
  { name: 'Advocacy',   color: '#6ab85b', light: '#f0fff0' },
  { name: 'Connection', color: '#e8965b', light: '#fff6ee' },
  { name: 'Creativity', color: '#a85be8', light: '#f8f0ff' },
  { name: 'Family',     color: '#e85b7f', light: '#fff0f4' },
  { name: 'Integrity',  color: '#5b7fe8', light: '#eef1ff' },
]

export default function MindMap({ ideas, onSelectIdea }) {
  const [expanded, setExpanded] = useState(null)

  const byValue = {}
  VALUES.forEach(v => { byValue[v.name] = [] })
  ideas.forEach(idea => {
    if (byValue[idea.value]) byValue[idea.value].push(idea)
  })

  const formatDate = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div style={styles.container}>
      {VALUES.map((v) => {
        const count = byValue[v.name].length
        const isExpanded = expanded === v.name

        return (
          <div key={v.name} style={styles.valueSection}>
            {/* Hub node */}
            <button
              style={{
                ...styles.hubBtn,
                background: isExpanded ? v.color : '#fff',
                borderColor: v.color,
                color: isExpanded ? '#fff' : v.color,
                boxShadow: isExpanded
                  ? `0 4px 20px ${v.color}40`
                  : 'var(--shadow-sm)',
              }}
              onClick={() => setExpanded(isExpanded ? null : v.name)}
            >
              <span style={styles.hubName}>{v.name}</span>
              <span style={{
                ...styles.hubCount,
                background: isExpanded ? 'rgba(255,255,255,0.3)' : v.light,
                color: isExpanded ? '#fff' : v.color,
              }}>
                {count}
              </span>
            </button>

            {/* Ideas list */}
            {isExpanded && (
              <div style={styles.ideasList}>
                {count === 0 ? (
                  <p style={styles.emptyNote}>No ideas here yet. Start capturing!</p>
                ) : (
                  byValue[v.name].map((idea) => (
                    <button
                      key={idea.id}
                      style={{ ...styles.ideaCard, borderLeftColor: v.color }}
                      onClick={() => onSelectIdea(idea)}
                    >
                      <p style={styles.ideaSummary}>{idea.summary}</p>
                      <p style={styles.ideaDate}>{formatDate(idea.created_at || idea.createdAt)}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  valueSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  hubBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderRadius: 'var(--radius)',
    border: '2px solid',
    transition: 'var(--transition)',
    textAlign: 'left',
    width: '100%',
  },
  hubName: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.05rem',
    fontWeight: '600',
    letterSpacing: '0.01em',
  },
  hubCount: {
    borderRadius: '100px',
    padding: '3px 12px',
    fontSize: '0.8rem',
    fontWeight: '700',
    letterSpacing: '0.03em',
    flexShrink: 0,
    marginLeft: '12px',
    minWidth: '32px',
    textAlign: 'center',
  },
  ideasList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingLeft: '16px',
    animation: 'fadeIn 0.2s ease',
  },
  emptyNote: {
    fontSize: '0.85rem',
    color: 'var(--gray-500)',
    fontStyle: 'italic',
    padding: '12px 16px',
  },
  ideaCard: {
    background: '#fff',
    border: 'none',
    borderLeft: '3px solid',
    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
    padding: '14px 18px',
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)',
    width: '100%',
  },
  ideaSummary: {
    fontSize: '0.92rem',
    lineHeight: '1.5',
    color: 'var(--gray-900)',
    marginBottom: '4px',
  },
  ideaDate: {
    fontSize: '0.75rem',
    color: 'var(--gray-500)',
    letterSpacing: '0.03em',
  },
}
