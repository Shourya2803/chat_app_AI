import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getDb } from '@/lib/server/database/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { otherUserId } = body;

    if (!otherUserId) {
      return NextResponse.json(
        { error: 'Other user ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Check if conversation exists
    const existing = await db.query(
      `SELECT * FROM conversations 
       WHERE (user1_id = $1 AND user2_id = $2) 
       OR (user1_id = $2 AND user2_id = $1)`,
      [userId, otherUserId]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ conversation: existing.rows[0] });
    }

    // Create new conversation
    const result = await db.query(
      `INSERT INTO conversations (user1_id, user2_id, created_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [userId, otherUserId]
    );

    return NextResponse.json({ conversation: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
