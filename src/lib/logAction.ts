import { db, auth } from '@/lib/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import type { AuditAction } from '@/types'

interface LogActionParams {
  action: AuditAction
  module: string
  description: string
  targetTable?: string
  targetId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
}

export async function logAction(params: LogActionParams) {
  const user = auth.currentUser

  if (!user) return

  let ipAddress = 'unknown'
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json')
    const ipData = await ipRes.json()
    ipAddress = ipData.ip
  } catch {
    // Silently fail - IP fetch is best-effort
  }

  const sessionId = typeof window !== 'undefined'
    ? localStorage.getItem('admin_session_id')
    : null

  const logData: any = {
    admin_id: user.uid,
    full_name: user.displayName || user.email || 'Admin',
    session_id: sessionId || null,
    action: params.action,
    module: params.module,
    description: params.description,
    ip_address: ipAddress,
    created_at: serverTimestamp()
  }

  if (params.targetTable !== undefined) logData.target_table = params.targetTable
  if (params.targetId !== undefined) logData.target_id = params.targetId
  if (params.oldValue !== undefined) logData.old_value = params.oldValue
  if (params.newValue !== undefined) logData.new_value = params.newValue

  try {
    // 1. Log to Legacy Firestore (USA)
    await addDoc(collection(db, 'audit_logs'), logData)

    // 2. Log to High-Speed MongoDB (Mumbai) - NEW API
    // Mapping keys for Mongoose model compatibility
    const mongoData = {
      ...logData,
      adminId: logData.admin_id,
      fullName: logData.full_name,
      sessionId: logData.session_id,
      ipAddress: logData.ip_address,
      targetTable: logData.target_table,
      targetId: logData.target_id,
      oldValue: logData.old_value,
      newValue: logData.new_value,
      createdAt: new Date().toISOString()
    };
    
    // Clean up snake_case keys for MongoDB
    delete mongoData.admin_id;
    delete mongoData.full_name;
    delete mongoData.session_id;
    delete mongoData.ip_address;
    delete mongoData.target_table;
    delete mongoData.target_id;
    delete mongoData.old_value;
    delete mongoData.new_value;
    delete mongoData.created_at;

    await fetch('/api/admin/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'log', data: mongoData })
    });
  } catch (error) {
    console.error('Failed to log action', error)
  }
}
