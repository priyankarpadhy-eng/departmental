import React from 'react'
import CloudStorageClient from '@/components/storage/CloudStorageClient'

export const metadata = {
  title: 'Cloud Storage - Dept Portal',
  description: 'Manage your Google Drive and Mega storage connections.',
}

export default function StudentStoragePage() {
  return <CloudStorageClient />
}
