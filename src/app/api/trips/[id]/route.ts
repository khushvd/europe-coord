import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sql`DELETE FROM trips WHERE id = ${id}`;
    return NextResponse.json({ message: 'Trip deleted' }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 });
  }
}
