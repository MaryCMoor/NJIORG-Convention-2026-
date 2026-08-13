import { useState } from 'react'
import { ChevronDown, Crown, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './RoleGate.css'

const ROLE_OPTIONS = [
  {
    value: 'rainbow_girls',
    label: 'Rainbow Girls',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'grand_officers',
    label: 'Grand Officers',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'adult_grand_executive_committee',
    label: 'Adult Grand Executive Committee',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'grand_staff',
    label: 'Grand Staff (Deputies, Chairpersons, etc.)',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'majority_executive_committee',
    label: 'Majority Executive Committee',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'mother_advisors_adult_advisors',
    label: 'Mother Advisors & Adult Advisors',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'pledge_mothers',
    label: 'Pledge Mothers',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'pledge_girls',
    label: 'Pledge Girls',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'eastern_star',
    label: 'Eastern Star',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'masons',
    label: 'Masons',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'demolay',
    label: 'DeMolay',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'other_masonic_organizations',
    label: 'Other Masonic Organizations',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'out_of_state_guests',
    label: 'Out of State Guests',
    description: 'View the main convention app, schedule, NJ Rainbow, speakers, and photos.',
  },
  {
    value: 'administrator',
    label: 'Admin',
    description: 'Access administrator dashboards, reports, and management areas.',
  },
]

const RoleGate = () => {
  const { selectRole, appConfig } = useApp()
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
            {appConfig.appTitle}
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
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <ChevronDown size={20} aria-hidden="true" />
            </div>

            <p id="role-description" className="role-description">
              {selected?.description ||
                'Your role customizes the squares and shortcuts you see in the app.'}
            </p>

            {requiresPassword && (
              <div className="admin-password-field">
                <label htmlFor="admin-password">
                  Administrator password
                </label>

                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(event) => {
                    setAdminPassword(event.target.value)
                    setError('')
                  }}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                />
              </div>
            )}

            {error && (
              <p className="role-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="role-gate-submit"
              type="submit"
              disabled={
                !role ||
                (requiresPassword && !adminPassword)
              }
            >
              Open Convention App
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default RoleGate
