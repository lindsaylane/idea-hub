import React, { useState, useEffect } from 'react'
import VoiceCapture from './VoiceCapture'
import MindMap from './MindMap'
import DetailPanel from './DetailPanel'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export default function App() {
  const [ideas, setIdeas] = useState([])
  const [selectedIdea, setSelectedIdea] = useState(null)
  const [view, setView] = useState('capture') // 'capture' | 'map'
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetchIdeas()
  }, [])

  const fetchIdeas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ideas`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setIdeas(data)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleIdeaSaved = (idea) => {
    setIdeas(prev => [idea, ...prev])
    // Switch to map view briefly to show the new idea
    setView('map')
  }

  const handleDelete = (id) => {
    setIdeas(prev => prev.filter(i => i.id !== id))
    setSelectedIdea(null)
  }

  const totalIdeas = ideas.length

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <h1 style={styles.logo}>Idea Hub</h1>
            <p style={styles.tagline}>{totalIdeas} {totalIdeas === 1 ? 'idea' : 'ideas'} captured</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.navPill}>
              <button
                style={{ ...styles.navBtn, ...(view === 'capture' ? styles.navBtnActive : {}) }}
                onClick={() => setView('capture')}
              >
                Capture
              </button>
              <button
                style={{ ...styles.navBtn, ...(view === 'map' ? styles.navBtnActive : {}) }}
                onClick={() => setView('map')}
              >
                Mind Map
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        {view === 'capture' && (
          <div style={styles.captureView}>
            <div style={styles.captureHero}>
              <h2 style={styles.captureHeading}>What's on your mind?</h2>
              <p style={styles.captureSubheading}>
                Speak your idea — Claude will capture, summarize,<br />
                and connect it to your values automatically.
              </p>
            </div>
            <VoiceCapture onIdeaSaved={handleIdeaSaved} />

            {/* Recent ideas teaser */}
            {ideas.length > 0 && (
              <div style={styles.recentSection}>
                <div style={styles.recentHeader}>
                  <h3 style={styles.recentTitle}>Recent ideas</h3>
                  <button style={styles.seeAllBtn} onClick={() => setView('map')}>
                    See all →
                  </button>
                </div>
                <div style={styles.recentList}>
                  {ideas.slice(0, 3).map(idea => (
                    <RecentCard key={idea.id} idea={idea} onClick={() => setSelectedIdea(idea)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'map' && (
          <div style={styles.mapView}>
            <div style={styles.mapHeader}>
              <h2 style={styles.mapHeading}>Your Mind Map</h2>
              <p style={styles.mapSubheading}>Tap a value to explore ideas</p>
            </div>

            {loading && (
              <div style={styles.loadingWrap}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Loading your ideas…</p>
              </div>
            )}

            {loadError && (
              <div style={styles.errorCard}>
                <p style={styles.errorText}>Couldn't load ideas. Make sure your backend is running and configured.</p>
                <button style={styles.retryBtn} onClick={fetchIdeas}>Try again</button>
              </div>
            )}

            {!loading && !loadError && (
              <MindMap ideas={ideas} onSelectIdea={setSelectedIdea} />
            )}
          </div>
        )}
      </main>

      {/* Detail panel */}
      {selectedIdea && (
        <DetailPanel
          idea={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

function RecentCard({ idea, onClick }) {
  const VALUE_COLORS = {
    'Justice':               '#5b7fe8',
    'Real Human Connection': '#e8965b',
    'Courage':               '#e85b7f',
    'Advocacy':              '#6ab85b',
    'Goodness':              '#a85be8',
  }
  const color = VALUE_COLORS[idea.value] || 'var(--pink)'

  return (
    <button style={{ ...styles.recentCard, borderLeftColor: color }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: '0.7rem', color, fontWeight: '700', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {idea.value}
        </span>
      </div>
      <p style={styles.recentSummary}>{idea.summary}</p>
    </button>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    background: 'var(--white)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: 'rgba(253,245,244,0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--gray-200)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    padding: '0 20px',
  },
  headerInner: {
    maxWidth: '640px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
  },
  logo: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.45rem',
    fontWeight: '600',
    color: 'var(--gray-900)',
    letterSpacing: '-0.01em',
  },
  tagline: {
    fontSize: '0.72rem',
    color: 'var(--gray-500)',
    letterSpacing: '0.04em',
    marginTop: '1px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navPill: {
    display: 'flex',
    background: 'var(--gray-100)',
    borderRadius: '100px',
    padding: '3px',
    gap: '2px',
  },
  navBtn: {
    background: 'transparent',
    border: 'none',
    borderRadius: '100px',
    padding: '6px 16px',
    fontSize: '0.8rem',
    fontWeight: '500',
    color: 'var(--gray-500)',
    transition: 'var(--transition)',
    letterSpacing: '0.02em',
  },
  navBtnActive: {
    background: '#fff',
    color: 'var(--gray-900)',
    boxShadow: 'var(--shadow-sm)',
  },
  main: {
    flex: 1,
    padding: '0 20px',
    paddingBottom: '60px',
  },
  captureView: {
    maxWidth: '480px',
    margin: '0 auto',
    paddingTop: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  captureHero: {
    textAlign: 'center',
  },
  captureHeading: {
    fontFamily: 'var(--font-serif)',
    fontSize: '2rem',
    fontWeight: '400',
    fontStyle: 'italic',
    color: 'var(--gray-900)',
    marginBottom: '10px',
  },
  captureSubheading: {
    fontSize: '0.9rem',
    color: 'var(--gray-500)',
    lineHeight: '1.6',
  },
  recentSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  recentHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  recentTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1rem',
    fontWeight: '400',
    color: 'var(--gray-700)',
  },
  seeAllBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--pink-deep)',
    fontSize: '0.82rem',
    fontWeight: '500',
    letterSpacing: '0.02em',
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  recentCard: {
    background: '#fff',
    border: 'none',
    borderLeft: '3px solid',
    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
    padding: '14px 16px',
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)',
    width: '100%',
  },
  recentSummary: {
    fontSize: '0.9rem',
    lineHeight: '1.5',
    color: 'var(--gray-900)',
  },
  mapView: {
    maxWidth: '640px',
    margin: '0 auto',
    paddingTop: '36px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  mapHeader: {
    marginBottom: '4px',
  },
  mapHeading: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.8rem',
    fontWeight: '400',
    fontStyle: 'italic',
    color: 'var(--gray-900)',
    marginBottom: '4px',
  },
  mapSubheading: {
    fontSize: '0.85rem',
    color: 'var(--gray-500)',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    paddingTop: '60px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid var(--pink-light)',
    borderTopColor: 'var(--pink)',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '0.85rem',
    color: 'var(--gray-500)',
    fontStyle: 'italic',
  },
  errorCard: {
    background: '#fff5f5',
    border: '1px solid #ffd4d4',
    borderRadius: 'var(--radius)',
    padding: '24px',
    textAlign: 'center',
  },
  errorText: {
    fontSize: '0.9rem',
    color: '#c0392b',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  retryBtn: {
    background: 'var(--pink)',
    color: '#fff',
    border: 'none',
    borderRadius: '100px',
    padding: '8px 20px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
}
