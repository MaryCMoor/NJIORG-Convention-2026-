import { useState } from 'react'
import { ChevronDown, Crown, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './RoleGate.css'

const ROLE_OPTIONS = [
  {
    value: 'attendee',
    label: 'Rainbow Girl',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'grand_officer',
    label: 'Grand Officer',
    description: 'Access officer-focused convention tools, committees, and announcements.',
  },
  {
    value: 'advisor',
    label: 'Advisor',
    description: 'View advisor tools for meals, housing, safety, and convention coordination.',
  },
  {
    value: 'administrator',
    label: 'Administrator',
    description: 'Access administrator dashboards, reports, and management areas.',
  },
]

const RoleGate = () => {
  const { selectRole } = useApp()
  const [role, setRole] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [error, setError] = useState('')

  const selected = ROLE_OPTIONS.find(option => option.value === role)
  const requiresPassword = role === 'administrator'

  const handleRoleChange = (event) => {
    setRole(event.target.value)
    setAdminPassword('')
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!role) return
    const result = selectRole(role, { password: adminPassword })
    if (!result?.ok) {
      setError(result?.error || 'Unable to open that role.')
    }
  }

  return (
    <main className="role-gate" data-react-root="true">
      <div className="role-gate-phone" aria-labelledby="role-gate-title">
        <div className="role-gate-status" aria-hidden="true">
          <span>9:41</span>
          <span>●●●</span>
        </div>

        <section className="role-gate-card">
          <div className="role-gate-icon">
            <Crown size={42} />
          </div>

          <p className="role-gate-kicker">
            <Sparkles size={16} />
            2026 Rainbow Grand Assembly Convention
          </p>

          <h1 id="role-gate-title">Welcome</h1>
          <p className="role-gate-copy">
            Before opening the app, choose which role best describes you.
          </p>

          <form className="role-gate-form" onSubmit={handleSubmit}>
            <label htmlFor="role-select">I am a...</label>
            <div className="role-select-wrap">
              <select
                id="role-select"
                value={role}
                onChange={handleRoleChange}
                aria-describedby="role-description"
              >
                <option value="">Select your role</option>
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown size={20} aria-hidden="true" />
            </div>

            <p id="role-description" className="role-description">
              {selected?.description || 'Your role customizes the squares and shortcuts you see in the app.'}
            </p>

            {requiresPassword && (
              <div className="admin-password-field">
                <label htmlFor="admin-password">Administrator password</label>
                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(event) => { setAdminPassword(event.target.value); setError('') }}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                />
              </div>
            )}

            {error && <p className="role-error" role="alert">{error}</p>}

            <button className="role-gate-submit" type="submit" disabled={!role || (requiresPassword && !adminPassword)}>
              Open Convention App
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default RoleGate
