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
      `SELECT id, clerk_id as "clerkId", email, username, first_name as "firstName", 
              last_name as "lastName", avatar_url as "avatarUrl", status 
       FROM users 
       WHERE clerk_id != $1 
       AND (username ILIKE $2 OR email ILIKE $2 OR first_name ILIKE $2 OR last_name ILIKE $2)
       LIMIT 20`,
      [userId, `%${query}%`]
    );

    return NextResponse.json({ 
      data: { users: result.rows },
      success: true 
    });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
