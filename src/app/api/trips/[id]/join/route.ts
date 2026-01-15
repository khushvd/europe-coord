import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, startDate, endDate } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newTraveler = { name, startDate, endDate };

    // Append the new traveler to the travelers array in the JSONB column
    // We use the || operator to concatenate jsonb arrays
    await sql`
      UPDATE trips 
      SET travelers = travelers || ${JSON.stringify([newTraveler])}::jsonb
      WHERE id = ${id}
    `;

    return NextResponse.json({ message: 'Joined trip successfully' }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to join trip' }, { status: 500 });
  }
}
