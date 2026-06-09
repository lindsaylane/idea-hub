import React, { useState, useRef, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export default function VoiceCapture({ onIdeaSaved }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState('idle') // idle | listening | processing | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort()
    }
  }, [])

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMsg('Voice input is not supported in this browser. Try Chrome on Android or Safari on iOS.')
      setStatus('error')
      return
    }

    finalTranscriptRef.current = ''
    setTranscript('')
    setErrorMsg('')

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setIsListening(true)
      setStatus('listening')
    }

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
      finalTranscriptRef.current += final
      setTranscript(finalTranscriptRef.current + interim)
    }

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') {
        setErrorMsg('Microphone error: ' + e.error)
        setStatus('error')
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const stopAndSubmit = async () => {
    if (recognitionRef.current) recognitionRef.current.stop()
    setIsListening(false)

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
      setErrorMsg('Something went wrong. Make sure the backend is running.')
      setStatus('error')
    }
  }

  const cancel = () => {
    if (recognitionRef.current) recognitionRef.current.abort()
    setIsListening(false)
    setTranscript('')
    finalTranscriptRef.current = ''
    setStatus('idle')
    setErrorMsg('')
  }

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <p style={styles.label}>
          {status === 'idle' && 'Tap to capture an idea'}
          {status === 'listening' && 'Listening…'}
          {status === 'processing' && 'Categorizing with Claude…'}
          {status === 'done' && 'Idea saved ✦'}
          {status === 'error' && 'Something went wrong'}
        </p>

        <div style={styles.buttonRow}>
          {(status === 'idle' || status === 'done') && (
            <button style={styles.micBtn} onClick={startListening} aria-label="Start recording">
              <MicIcon />
            </button>
          )}

          {status === 'listening' && (
            <>
              <div style={styles.pulseWrap}>
                <div style={styles.pulseRing} />
                <button style={{ ...styles.micBtn, ...styles.micBtnActive }} onClick={stopAndSubmit} aria-label="Stop and save">
                  <StopIcon />
                </button>
              </div>
              <button style={styles.cancelBtn} onClick={cancel}>Cancel</button>
            </>
          )}

          {status === 'processing' && (
            <div style={styles.spinner} />
          )}
        </div>

        {transcript && status === 'listening' && (
          <div style={styles.transcriptBox}>
            <p style={styles.transcriptText}>{transcript}</p>
          </div>
        )}

        {errorMsg && (
          <p style={styles.error}>{errorMsg}</p>
        )}

        {status === 'listening' && (
          <p style={styles.hint}>Tap the stop button when you're done speaking</p>
        )}
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
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
  buttonRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
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
  micBtnActive: {
    background: '#e8709a',
    boxShadow: '0 4px 24px rgba(232,112,154,0.55)',
  },
  pulseWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'rgba(244,166,193,0.4)',
    animation: 'pulse-ring 1.4s ease-out infinite',
  },
  cancelBtn: {
    background: 'none',
    color: 'var(--gray-500)',
    fontSize: '0.85rem',
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
    maxHeight: '120px',
    overflowY: 'auto',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--gray-200)',
  },
  transcriptText: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: 'var(--gray-700)',
  },
  hint: {
    fontSize: '0.78rem',
    color: 'var(--gray-500)',
    letterSpacing: '0.03em',
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
