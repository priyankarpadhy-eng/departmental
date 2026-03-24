import { NextRequest, NextResponse } from 'next/server'
import { Storage } from 'megajs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folderName = formData.get('folder') as string || 'DeptPortal_Shared'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const email = process.env.MEGA_EMAIL
    const password = process.env.MEGA_PASSWORD

    if (!email || !password) {
      return NextResponse.json({ error: 'MEGA_EMAIL and MEGA_PASSWORD missing in .env.local' }, { status: 500 })
    }

    // Initialize Mega Storage
    const storage = await new Promise<Storage>((resolve, reject) => {
      const s = new Storage({ email, password, keepalive: false }, (err) => {
        if (err) return reject(err)
        resolve(s)
      })
    })

    await new Promise(resolve => setTimeout(resolve, 1000)) // Give it a sec to load state if needed

    // Find or create directory
    let targetFolder = storage.root.children?.find(c => c.name === folderName)
    if (!targetFolder) {
      targetFolder = await storage.mkdir(folderName)
    }

    // Convert file to buffer for upload
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Mega
    const uploadedFile = await targetFolder.upload({
      name: file.name,
      size: buffer.length
    }, buffer).complete

    // Create a public link for the uploaded file so it can be downloaded/viewed
    const link = await uploadedFile.link()

    return NextResponse.json({ 
      success: true, 
      url: link,
      name: file.name,
      size: buffer.length
    })

  } catch (error: any) {
    console.error('Mega Central Upload Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
