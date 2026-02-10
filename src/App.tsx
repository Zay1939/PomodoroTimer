import './App.css'
import { useEffect, useState } from 'react'

const POMODORO_MINUTES = 25
const SHORT_BREAK_MINUTES = 5
const LONG_BREAK_MINUTES = 15
type Mode = 'focus' | 'shortBreak' | 'longBreak'

type Preset = {
  label: string
  focus: number
  shortBreak: number
  longBreak: number
  cyclesBeforeLongBreak: number
}

const PRESETS: Preset[] = [
  {
    label: '25 / 5 / 15',
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
    cyclesBeforeLongBreak: 4,
  },
  {
    label: '45 / 15 / 30',
    focus: 45,
    shortBreak: 15,
    longBreak: 30,
    cyclesBeforeLongBreak: 3,
  },
  {
    label: '50 / 10 / 30',
    focus: 50,
    shortBreak: 10,
    longBreak: 30,
    cyclesBeforeLongBreak: 3,
  },
]

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
}

function getModeLabel(mode: Mode) {
  switch (mode) {
    case 'focus':
      return 'Focus'
    case 'shortBreak':
      return 'Short Break'
    case 'longBreak':
      return 'Long Break'
  }
}

function getModeDescription(mode: Mode) {
  switch (mode) {
    case 'focus':
      return 'Stay on one task. No notifications, no distractions.'
    case 'shortBreak':
      return 'Look away from the screen, grab some water, stretch.'
    case 'longBreak':
      return 'You finished a full cycle. Take a deeper break.'
  }
}

function App() {
  const [mode, setMode] = useState<Mode>('focus')
  const [focusMinutes, setFocusMinutes] = useState(POMODORO_MINUTES)
  const [shortBreakMinutes, setShortBreakMinutes] = useState(SHORT_BREAK_MINUTES)
  const [longBreakMinutes, setLongBreakMinutes] = useState(LONG_BREAK_MINUTES)
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_MINUTES * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0)
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(4)
  const [isEditingDuration, setIsEditingDuration] = useState(false)
  const [pendingMinutes, setPendingMinutes] = useState('')

  // Tick every second while running
  useEffect(() => {
    if (!isRunning) return
    if (secondsLeft <= 0) return

    const id = setInterval(() => {
      setSecondsLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(id)
  }, [isRunning, secondsLeft])

  // When timer hits zero, advance to the next mode
  useEffect(() => {
    if (secondsLeft > 0) return
    if (!isRunning) return

    if (mode === 'focus') {
      const newCompleted = completedFocusSessions + 1
      setCompletedFocusSessions(newCompleted)

      const shouldTakeLongBreak =
        newCompleted % cyclesBeforeLongBreak === 0

      if (shouldTakeLongBreak) {
        setMode('longBreak')
        setSecondsLeft(LONG_BREAK_MINUTES * 60)
      } else {
        setMode('shortBreak')
        setSecondsLeft(SHORT_BREAK_MINUTES * 60)
      }
    } else {
      // Any break returns to focus
      setMode('focus')
      setSecondsLeft(POMODORO_MINUTES * 60)
    }
  }, [secondsLeft, isRunning, mode, completedFocusSessions])

  const handleStartPause = () => {
    setIsRunning(prev => !prev)
  }

  const handleReset = () => {
    setIsRunning(false)
    if (mode === 'focus') {
      setSecondsLeft(focusMinutes * 60)
    } else if (mode === 'shortBreak') {
      setSecondsLeft(shortBreakMinutes * 60)
    } else {
      setSecondsLeft(longBreakMinutes * 60)
    }
  }

  const handleSkip = () => {
    if (mode === 'focus') {
      // Skip straight to a break and count as a completed focus block
      const newCompleted = completedFocusSessions + 1
      setCompletedFocusSessions(newCompleted)

      const nextIsLongBreak =
        newCompleted % cyclesBeforeLongBreak === 0

      if (nextIsLongBreak) {
        setMode('longBreak')
        setSecondsLeft(longBreakMinutes * 60)
      } else {
        setMode('shortBreak')
        setSecondsLeft(shortBreakMinutes * 60)
      }
    } else {
      // Skip any break and go back to focus
      setMode('focus')
      setSecondsLeft(focusMinutes * 60)
    }
    setIsRunning(true)
  }

  const handleResetFocusCount = () => {
    setCompletedFocusSessions(0)
  }

  const applyPreset = (preset: Preset) => {
    setFocusMinutes(preset.focus)
    setShortBreakMinutes(preset.shortBreak)
    setLongBreakMinutes(preset.longBreak)
    setCyclesBeforeLongBreak(preset.cyclesBeforeLongBreak)

    if (!isRunning) {
      if (mode === 'focus') {
        setSecondsLeft(preset.focus * 60)
      } else if (mode === 'shortBreak') {
        setSecondsLeft(preset.shortBreak * 60)
      } else {
        setSecondsLeft(preset.longBreak * 60)
      }
    }
  }

  const openEditDuration = () => {
    setIsRunning(false)
    const currentMinutes =
      mode === 'focus'
        ? focusMinutes
        : mode === 'shortBreak'
          ? shortBreakMinutes
          : longBreakMinutes
    setPendingMinutes(String(currentMinutes))
    setIsEditingDuration(true)
  }

  const commitEditDuration = () => {
    const raw = Number(pendingMinutes)
    if (!raw || raw <= 0) {
      setIsEditingDuration(false)
      return
    }

    let clamped = raw
    if (mode === 'focus') {
      clamped = Math.min(180, Math.max(1, raw))
      setFocusMinutes(clamped)
    } else if (mode === 'shortBreak') {
      clamped = Math.min(60, Math.max(1, raw))
      setShortBreakMinutes(clamped)
    } else {
      clamped = Math.min(90, Math.max(1, raw))
      setLongBreakMinutes(clamped)
    }

    setSecondsLeft(clamped * 60)
    setIsEditingDuration(false)
  }

  const cancelEditDuration = () => {
    setIsEditingDuration(false)
  }

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode)
    setIsRunning(false)
    if (nextMode === 'focus') {
      setSecondsLeft(focusMinutes * 60)
    } else if (nextMode === 'shortBreak') {
      setSecondsLeft(shortBreakMinutes * 60)
    } else {
      setSecondsLeft(longBreakMinutes * 60)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title-group">
          <h1>Pomodoro</h1>
        </div>
        <div className="cycle-indicator" aria-label="Completed focus sessions">
          {Array.from({ length: cyclesBeforeLongBreak }).map((_, index) => {
            const filled = index < completedFocusSessions % cyclesBeforeLongBreak
            return (
              <span
                key={index}
                className={`cycle-dot ${filled ? 'cycle-dot--filled' : ''}`}
              />
            )
          })}
        </div>
      </header>

      <main className="app-main">
        <section className="timer-card">
          <div className="mode-switcher" role="tablist" aria-label="Timer mode">
            <button
              role="tab"
              aria-selected={mode === 'focus'}
              className={`mode-pill ${mode === 'focus' ? 'mode-pill--active' : ''}`}
              onClick={() => switchMode('focus')}
            >
              Focus
            </button>
            <button
              role="tab"
              aria-selected={mode === 'shortBreak'}
              className={`mode-pill ${mode === 'shortBreak' ? 'mode-pill--active' : ''}`}
              onClick={() => switchMode('shortBreak')}
            >
              Short break
            </button>
            <button
              role="tab"
              aria-selected={mode === 'longBreak'}
              className={`mode-pill ${mode === 'longBreak' ? 'mode-pill--active' : ''}`}
              onClick={() => switchMode('longBreak')}
            >
              Long break
            </button>
          </div>

          <p className="mode-description">{getModeDescription(mode)}</p>

          <div
            className={`timer-display timer-display--${mode}`}
            aria-label={`${getModeLabel(mode)} timer`}
            onClick={!isEditingDuration ? openEditDuration : undefined}
          >
            {!isEditingDuration ? (
              <span className="time-text">{formatTime(secondsLeft)}</span>
            ) : (
              <div className="timer-edit">
                <label className="timer-edit-label">
                  <span>Set minutes for this block</span>
                  <input
                    type="number"
                    min={1}
                    max={mode === 'focus' ? 180 : mode === 'shortBreak' ? 60 : 90}
                    value={pendingMinutes}
                    onChange={e => setPendingMinutes(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        commitEditDuration()
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        cancelEditDuration()
                      }
                    }}
                    autoFocus
                  />
                </label>
                <div className="timer-edit-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={commitEditDuration}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={cancelEditDuration}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="timer-controls">
            <button
              className="primary-button"
              onClick={handleStartPause}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              className="ghost-button"
              onClick={handleReset}
              disabled={secondsLeft === 0}
            >
              Reset
            </button>
            <button
              className="ghost-button"
              onClick={handleSkip}
            >
              Skip
            </button>
          </div>

          <div className="focus-counter">
            <span className="focus-counter-label">
              Focus blocks completed: <strong>{completedFocusSessions}</strong>
            </span>
            <button
              type="button"
              className="focus-counter-reset"
              onClick={handleResetFocusCount}
              disabled={completedFocusSessions === 0}
            >
              Reset count
            </button>
          </div>

          <div className="presets">
            <span className="presets-label">
              Presets&nbsp;
              <span className="presets-label-hint">(focus / short break / long break)</span>
            </span>
            <div className="presets-buttons">
              {PRESETS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  className="preset-button"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

    </div>
  )
}

export default App
