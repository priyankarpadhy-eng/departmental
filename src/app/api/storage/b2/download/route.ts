import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fileKey = searchParams.get('key')
    
    if (!fileKey) {
      return NextResponse.json({ error: 'Missing file key' }, { status: 400 })
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

    const s3 = new S3Client({
      endpoint: `https://${endpoint}`,
      region: endpoint.split('.')[1], // Extracts 'eu-central-003'
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: appKey,
      },
      forcePathStyle: true
    })

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    })

    // Generate a secure URL valid for 1 hour (3600 seconds)
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })

    // Instantly redirect the user's browser to the download link
    // B2 will serve the file with correct permissions based on the key
    return NextResponse.redirect(presignedUrl)

  } catch (error: any) {
    console.error('--- Backblaze B2 Download Error ---')
    console.error(error)
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
  }
}
