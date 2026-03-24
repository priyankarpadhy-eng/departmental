import { NextRequest, NextResponse } from 'next/server'
import * as mega from 'megajs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    // Attempt to login to Mega
    try {
      // In megajs, login is asynchronous and returns a Storage object or throws
      // The current version of megajs (1.0+) uses a slightly different API
      const storage = await new Promise((resolve, reject) => {
        const s = new mega.Storage({ email, password, keepalive: false }, (err) => {
          if (err) return reject(err)
          resolve(s)
        })
      })

      if (!storage) {
        throw new Error('Could not initialize storage')
      }

      // If we reach here, credentials are correct
      return NextResponse.json({ success: true, message: 'Account verified' })
    } catch (err: any) {
      console.error('Mega login error:', err)
      return NextResponse.json({ error: 'Invalid Mega credentials or connection error' }, { status: 401 })
    }

  } catch (error) {
    console.error('Verify Mega Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
