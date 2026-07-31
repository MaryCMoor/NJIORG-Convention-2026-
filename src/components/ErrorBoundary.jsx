import { Component } from 'react'

/**
 * Catches render errors anywhere below it so a single broken component
 * shows a readable message instead of blanking the whole app.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state

    if (!error) return this.props.children

    return (
      <div className="page-error" role="alert">
        <div className="error-icon" aria-hidden="true">🎪</div>
        <h2 className="error-title">Something went wrong on this page</h2>
        <p className="error-message">
          The rest of the app is still working — head back or try again.
        </p>
        <pre
          style={{
            maxWidth: '100%',
            overflowX: 'auto',
            fontSize: '0.75rem',
            color: 'var(--color-text-light)',
            background: 'var(--color-gray-100)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'left',
          }}
        >
          {error?.message || String(error)}
        </pre>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={this.handleReset}>
            Try Again
          </button>
          <a className="btn btn-secondary" href="#/">
            Back to Home
          </a>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
