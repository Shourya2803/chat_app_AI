import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getDb } from '@/lib/server/database/client';
import { MessageQueue } from '@/lib/server/workers/message.queue';

// Initialize message queue
const messageQueue = new MessageQueue();

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const db = await getDb();
    const result = await db.query(
      `SELECT m.*, 
        sender.name as sender_name,
        sender.avatar_url as sender_avatar
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3`,
      [params.id, limit, offset]
    );

    return NextResponse.json({
      messages: result.rows.reverse(),
      page,
      hasMore: result.rows.length === limit,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, imageUrl, receiverId, tone } = body;

    if (!content && !imageUrl) {
      return NextResponse.json(
        { error: 'Content or image is required' },
        { status: 400 }
      );
    }

    // Add message to queue for processing
    const job = await messageQueue.addMessage({
      conversationId: params.id,
      senderId: userId,
      receiverId,
      content,
      mediaUrl: imageUrl,
      applyTone: !!tone,
      toneType: tone,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Message queued for processing',
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
