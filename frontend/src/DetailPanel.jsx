import React, { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const VALUE_COLORS = {
  'Justice':               { bg: '#f0f4ff', accent: '#5b7fe8', dot: '#5b7fe8' },
  'Real Human Connection': { bg: '#fff8f0', accent: '#e8965b', dot: '#e8965b' },
  'Courage':               { bg: '#fff0f4', accent: '#e85b7f', dot: '#e85b7f' },
  'Advocacy':              { bg: '#f4fff0', accent: '#6ab85b', dot: '#6ab85b' },
  'Goodness':              { bg: '#fdf0ff', accent: '#a85be8', dot: '#a85be8' },
}

export default function DetailPanel({ idea, onClose, onDelete }) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const colors = VALUE_COLORS[idea.value] || { bg: '#fdf5f4', accent: 'var(--pink)', dot: 'var(--pink)' }

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(idea.starter_prompt || idea.starterPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this idea? This cannot be undone.')) return
    setDeleting(true)
    try {
      await fetch(`${API_URL}/api/ideas/${idea.id}`, { method: 'DELETE' })
      onDelete(idea.id)
    } catch {
      setDeleting(false)
    }
  }

  const formatDate = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        {/* Value badge */}
        <div style={{ ...styles.valueBadge, background: colors.bg, borderColor: colors.accent + '40' }}>
          <span style={{ ...styles.valueDot, background: colors.dot }} />
          <span style={{ ...styles.valueLabel, color: colors.accent }}>{idea.value}</span>
        </div>

        {/* Summary */}
        <h2 style={styles.summary}>{idea.summary}</h2>

        <p style={styles.date}>{formatDate(idea.created_at || idea.createdAt)}</p>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Reasoning */}
        <section style={styles.section}>
          <h3 style={styles.sectionLabel}>Why this value</h3>
          <p style={styles.sectionText}>{idea.reasoning}</p>
        </section>

        {/* Full transcription */}
        <section style={styles.section}>
          <h3 style={styles.sectionLabel}>Original idea</h3>
          <p style={{ ...styles.sectionText, ...styles.transcription }}>{idea.transcription}</p>
        </section>

        {/* Starter prompt */}
        <section style={styles.section}>
          <div style={styles.promptHeader}>
            <h3 style={styles.sectionLabel}>Starter prompt</h3>
            <button style={{ ...styles.copyBtn, ...(copied ? styles.copyBtnDone : {}) }} onClick={copyPrompt}>
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <div style={styles.promptBox}>
            <pre style={styles.promptText}>{idea.starter_prompt || idea.starterPrompt}</pre>
          </div>
        </section>

        {/* Delete */}
        <button
          style={{ ...styles.deleteBtn, opacity: deleting ? 0.5 : 1 }}
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting…' : 'Delete idea'}
        </button>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(42,31,28,0.45)',
    backdropFilter: 'blur(4px)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '0',
    animation: 'fadeIn 0.2s ease',
  },
  panel: {
    background: '#fff',
    borderRadius: '24px 24px 0 0',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '32px 28px 48px',
    position: 'relative',
    boxShadow: '0 -8px 40px rgba(42,31,28,0.15)',
    animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
  },
  closeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'var(--gray-100)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--gray-500)',
    transition: 'var(--transition)',
  },
  valueBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '100px',
    border: '1px solid',
    marginBottom: '16px',
  },
  valueDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  valueLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  summary: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.45rem',
    lineHeight: '1.4',
    color: 'var(--gray-900)',
    marginBottom: '8px',
    paddingRight: '40px',
  },
  date: {
    fontSize: '0.8rem',
    color: 'var(--gray-500)',
    letterSpacing: '0.03em',
  },
  divider: {
    height: '1px',
    background: 'var(--gray-200)',
    margin: '24px 0',
  },
  section: {
    marginBottom: '24px',
  },
  sectionLabel: {
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gray-500)',
    marginBottom: '8px',
  },
  sectionText: {
    fontSize: '0.95rem',
    lineHeight: '1.65',
    color: 'var(--gray-700)',
  },
  transcription: {
    background: 'var(--gray-100)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px 16px',
    fontStyle: 'italic',
  },
  promptHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  promptBox: {
    background: 'var(--gray-100)',
    borderRadius: 'var(--radius-sm)',
    padding: '16px',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  promptText: {
    fontSize: '0.82rem',
    lineHeight: '1.7',
    color: 'var(--gray-700)',
    whiteSpace: 'pre-wrap',
    fontFamily: 'var(--font-sans)',
  },
  copyBtn: {
    background: 'var(--pink)',
    color: '#fff',
    borderRadius: '100px',
    padding: '5px 16px',
    fontSize: '0.78rem',
    fontWeight: '600',
    letterSpacing: '0.04em',
    transition: 'var(--transition)',
    border: 'none',
  },
  copyBtnDone: {
    background: '#6ab85b',
  },
  deleteBtn: {
    marginTop: '8px',
    background: 'none',
    color: 'var(--gray-500)',
    fontSize: '0.82rem',
    letterSpacing: '0.04em',
    border: '1px solid var(--gray-300)',
    borderRadius: '100px',
    padding: '8px 20px',
    transition: 'var(--transition)',
    display: 'block',
    marginLeft: 'auto',
  },
}
