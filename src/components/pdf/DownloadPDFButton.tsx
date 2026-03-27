'use client'

import React, { useEffect, useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { CertificateTemplate } from './CertificateTemplate'

 export default function DownloadPDFButton({ request, label, style }: { request: any, label?: string, style?: any }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return <span className="secondary-text" style={{ fontSize: '11px' }}>Loading...</span>

  const defaultStyle = {
    textDecoration: 'none',
    color: 'var(--brand-primary)',
    fontWeight: 500,
    fontSize: '11px',
    display: 'inline-block',
    padding: '4px 8px',
    background: 'rgba(15, 110, 86, 0.1)',
    borderRadius: '4px'
  }

  return (
    <PDFDownloadLink
      document={<CertificateTemplate request={request} />}
      fileName={`${request.type.replace(/\s+/g, '_')}_${request.id.substring(0,8)}.pdf`}
      style={style || defaultStyle}
    >
      {({ loading }) => (loading ? 'Loading...' : (label || 'Download PDF'))}
    </PDFDownloadLink>
  )
}
