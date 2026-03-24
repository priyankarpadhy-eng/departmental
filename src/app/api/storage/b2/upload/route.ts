import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const keyId = process.env.B2_APPLICATION_KEY_ID
    const appKey = process.env.B2_APPLICATION_KEY
    const bucketName = process.env.B2_BUCKET_NAME
    const endpoint = process.env.B2_ENDPOINT 

    if (!keyId || !appKey || !bucketName || !endpoint) {
      return NextResponse.json({ 
        error: 'Backblaze B2 credentials missing in .env.local' 
      }, { status: 500 })
    }

    // Initialize S3 Client specifically for B2
    const s3 = new S3Client({
      endpoint: `https://${endpoint}`,
      region: endpoint.split('.')[1], // Extracts 'eu-central-003'
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: appKey,
      },
      forcePathStyle: true // Mandatory for B2 S3 API
    })

    // Clean filename and ensure global unique path
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    // Prefix with a folder if needed, or just root
    const fileKey = `CentralStorage/${Date.now()}_${safeName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to B2 (Private Bucket)
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
    }))

    // Return the actual KEY, not a direct public URL
    // We will use this key to generate a presigned download link later
    return NextResponse.json({ 
      success: true, 
      fileKey: fileKey, // IMPORTANT: Store this in Firestore
      name: file.name,
      size: buffer.length
    })

  } catch (error: any) {
    console.error('--- Backblaze B2 Upload Error Details ---')
    console.error('Name:', error.name)
    console.error('Code:', error.Code || error.$metadata?.httpStatusCode)
    console.error('Message:', error.message)
    console.error('-----------------------------------------')
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error.name
    }, { status: 500 })
  }
}
