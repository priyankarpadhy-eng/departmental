'use client'

import React, { useEffect, useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { CertificateTemplate } from './CertificateTemplate'
import { Download } from 'lucide-react'

 export default function DownloadPDFButton({ request, label, style }: { request: any, label?: string, style?: any }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return <span className="secondary-text" style={{ fontSize: '11px' }}>Loading...</span>

  return (
    <PDFDownloadLink
      document={<CertificateTemplate request={request} />}
      fileName={`${(request.type || 'Document').replace(/\s+/g, '_')}_${(request.id || 'N/A').substring(0, 8)}.pdf`}

      className="btn btn-sm btn-outlined"
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px', 
        textDecoration: 'none',
        color: 'var(--accent-student)',
        borderColor: 'var(--accent-student)',
        ...style 
      }}
    >
      {({ loading, error }) => (
        <>
          <Download size={14} />
          {loading ? 'Generating...' : error ? 'Error!' : (label || 'Download PDF')}
        </>
      )}

    </PDFDownloadLink>
  )
}
