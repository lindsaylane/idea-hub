import React, { useState, useRef, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export default function VoiceCapture({ onIdeaSaved }) {
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState('idle') // idle | listening | paused | processing | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')
  const intentRef = useRef('stop') // why recognition ended: 'pause' | 'stop' | 'cancel'

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort()
    }
  }, [])

  const createRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMsg('Voice input is not supported in this browser. Try Safari on iOS or Chrome on Android.')
      setStatus('error')
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (e) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript
        } else {
          interim += e.results[i][0].transcript
        }
      }
      if (final) {
        finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + final).trim()
      }
      setTranscript((finalTranscriptRef.current + ' ' + interim).trim())
    }

    recognition.onerror = (e) => {
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        setErrorMsg('Microphone error: ' + e.error)
        setStatus('error')
      }
    }

    return recognition
  }

  const startListening = () => {
    finalTranscriptRef.current = ''
    setTranscript('')
    setErrorMsg('')

    const recognition = createRecognition()
    if (!recognition) return
    recognitionRef.current = recognition
    recognition.onstart = () => setStatus('listening')
    recognition.start()
  }

  const pauseListening = () => {
    intentRef.current = 'pause'
    if (recognitionRef.current) recognitionRef.current.stop()
    setStatus('paused')
    setTranscript(finalTranscriptRef.current)
  }

  const resumeListening = () => {
    const recognition = createRecognition()
    if (!recognition) return
    recognitionRef.current = recognition
    recognition.onstart = () => setStatus('listening')
    recognition.start()
  }

  const stopAndSubmit = async () => {
    intentRef.current = 'stop'
    if (recognitionRef.current) recognitionRef.current.stop()

    const text = finalTranscriptRef.current.trim() || transcript.trim()
    if (!text) {
      setStatus('idle')
      setTranscript('')
      return
    }

    setStatus('processing')

    try {
      const res = await fetch(`${API_URL}/api/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: text })
      })

      if (!res.ok) throw new Error('Server error')

      const idea = await res.json()
      setStatus('done')
      setTranscript('')
      finalTranscriptRef.current = ''
      onIdeaSaved(idea)

      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      setErrorMsg('Something went wrong. Your words are safe — tap Stop & Save to retry.')
      setStatus('paused')
    }
  }

  const cancel = () => {
    intentRef.current = 'cancel'
    if (recognitionRef.current) recognitionRef.current.abort()
    setTranscript('')
    finalTranscriptRef.current = ''
    setStatus('idle')
    setErrorMsg('')
  }

  const isActive = status === 'listening' || status === 'paused'

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <p style={styles.label}>
          {status === 'idle' && 'Tap to capture an idea'}
          {status === 'listening' && 'Listening…'}
          {status === 'paused' && 'Paused — your words are saved'}
          {status === 'processing' && 'Categorizing with Claude…'}
          {status === 'done' && 'Idea saved ✦'}
          {status === 'error' && 'Something went wrong'}
        </p>

        {/* Idle / Done: big mic button */}
        {(status === 'idle' || status === 'done' || status === 'error') && (
          <button style={styles.micBtn} onClick={startListening} aria-label="Start recording">
            <MicIcon />
          </button>
        )}

        {/* Listening: pulse + pause/stop */}
        {status === 'listening' && (
          <div style={styles.controlsRow}>
            <div style={styles.controlGroup}>
              <button style={styles.pauseBtn} onClick={pauseListening} aria-label="Pause">
                <PauseIcon />
              </button>
              <span style={styles.controlLabel}>Pause</span>
            </div>

            <div style={styles.controlGroup}>
              <div style={styles.pulseWrap}>
                <div style={styles.pulseRing} />
                <button style={styles.stopBtn} onClick={stopAndSubmit} aria-label="Stop and save">
                  <CheckIcon />
                </button>
              </div>
              <span style={styles.controlLabel}>Stop & Save</span>
            </div>
          </div>
        )}

        {/* Paused: resume/stop */}
        {status === 'paused' && (
          <div style={styles.controlsRow}>
            <div style={styles.controlGroup}>
              <button style={styles.resumeBtn} onClick={resumeListening} aria-label="Resume">
                <MicIcon size={22} />
              </button>
              <span style={styles.controlLabel}>Resume</span>
            </div>

            <div style={styles.controlGroup}>
              <button style={styles.stopBtn} onClick={stopAndSubmit} aria-label="Stop and save">
                <CheckIcon />
              </button>
              <span style={styles.controlLabel}>Stop & Save</span>
            </div>
          </div>
        )}

        {status === 'processing' && <div style={styles.spinner} />}

        {/* Live / paused transcript */}
        {transcript && isActive && (
          <div style={styles.transcriptBox}>
            <p style={styles.transcriptText}>{transcript}</p>
          </div>
        )}

        {errorMsg && <p style={styles.error}>{errorMsg}</p>}

        {isActive && (
          <button style={styles.cancelBtn} onClick={cancel}>Cancel & discard</button>
        )}
      </div>
    </div>
  )
}

function MicIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1.5"/>
      <rect x="14" y="4" width="4" height="16" rx="1.5"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

const styles = {
  container: {
    background: 'linear-gradient(135deg, #fdf5f4 0%, #fce8f0 100%)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--pink-mid)',
    padding: '32px 24px',
    boxShadow: 'var(--shadow-md)',
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  label: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.15rem',
    color: 'var(--gray-700)',
    fontStyle: 'italic',
    letterSpacing: '0.01em',
  },
  micBtn: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'var(--pink)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(244,166,193,0.5)',
    transition: 'var(--transition)',
    border: 'none',
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '40px',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  controlLabel: {
    fontSize: '0.72rem',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--gray-500)',
  },
  pauseBtn: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#fff',
    color: 'var(--gray-700)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-md)',
    border: '2px solid var(--gray-300)',
  },
  resumeBtn: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'var(--pink)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(244,166,193,0.5)',
    border: 'none',
  },
  stopBtn: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#6ab85b',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(106,184,91,0.45)',
    border: 'none',
    position: 'relative',
    zIndex: 1,
  },
  pulseWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'rgba(106,184,91,0.35)',
    animation: 'pulse-ring 1.4s ease-out infinite',
    pointerEvents: 'none',
  },
  cancelBtn: {
    background: 'none',
    color: 'var(--gray-500)',
    fontSize: '0.82rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    padding: '4px 8px',
    border: 'none',
  },
  transcriptBox: {
    background: '#fff',
    borderRadius: 'var(--radius-sm)',
    padding: '16px 20px',
    width: '100%',
    maxHeight: '140px',
    overflowY: 'auto',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--gray-200)',
  },
  transcriptText: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: 'var(--gray-700)',
  },
  error: {
    fontSize: '0.85rem',
    color: '#c0392b',
    textAlign: 'center',
    maxWidth: '280px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid var(--pink-light)',
    borderTopColor: 'var(--pink)',
    animation: 'spin 0.8s linear infinite',
  },
}
