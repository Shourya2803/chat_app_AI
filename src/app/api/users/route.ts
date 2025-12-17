import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getDb } from '@/lib/server/database/client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    const db = await getDb();
    const result = await db.query(
      `SELECT id, email, name, avatar_url, bio, status 
       FROM users 
       WHERE id != $1 
       AND (name ILIKE $2 OR email ILIKE $2)
       LIMIT 20`,
      [userId, `%${query}%`]
    );

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
