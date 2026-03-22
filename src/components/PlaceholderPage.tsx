import { Topbar } from '@/components/layout/Topbar'

interface PlaceholderProps {
  title: string
  description: string
  accentColor: string
}

export function PlaceholderPage({ title, description, accentColor }: PlaceholderProps) {
  return (
    <>
      <Topbar title={title} accentColor={accentColor} />
      <div className="content-container">
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 32px',
            textAlign: 'center',
            minHeight: '400px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'var(--surface-secondary)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="section-heading" style={{ marginBottom: '8px', color: accentColor }}>
            {title}
          </h2>
          <p className="secondary-text" style={{ maxWidth: '400px' }}>
            {description}
          </p>
          <div
            style={{
              marginTop: '24px',
              padding: '8px 16px',
              background: 'var(--surface-secondary)',
              borderRadius: '20px',
              fontSize: '11px',
              color: 'var(--text-tertiary)',
            }}
          >
            Phase 2–8 implementation
          </div>
        </div>
      </div>
    </>
  )
}
