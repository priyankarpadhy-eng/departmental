import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/mongodb';
import { StudentPost } from '@/models/Interactions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParams = parseInt(searchParams.get('limit') || '50');

    await connectDB();

    // Fetch most recent posts from MongoDB using Mongoose Model
    const posts = await StudentPost.find({})
      .sort({ created_at: -1 })
      .limit(limitParams)
      .lean();

    // Map id to be consistent with client expectations if needed
    const formattedPosts = posts.map((p: any) => ({
        ...p,
        id: p._id.toString()
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error: any) {
    console.error('Feed API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch social feed' }, { status: 500 });
  }
}
