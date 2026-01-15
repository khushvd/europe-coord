import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`SELECT * FROM trips ORDER BY start_date ASC`;
    
    // Convert database fields to match frontend expectation (camelCase)
    const trips = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      city: row.city,
      country: row.country,
      startDate: row.start_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      endDate: row.end_date.toISOString().split('T')[0],
      travelers: row.travelers,
      createdAt: row.created_at
    }));

    return NextResponse.json(trips, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, city, country, startDate, endDate, travelers } = body;

    if (!name || !city || !country || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert into database
    // Note: travelers is stored as a JSONB array
    const result = await sql`
      INSERT INTO trips (name, city, country, start_date, end_date, travelers)
      VALUES (${name}, ${city}, ${country}, ${startDate}, ${endDate}, ${JSON.stringify(travelers)})
      RETURNING *;
    `;

    const row = result.rows[0];
    const newTrip = {
      id: row.id,
      name: row.name,
      city: row.city,
      country: row.country,
      startDate: row.start_date.toISOString().split('T')[0],
      endDate: row.end_date.toISOString().split('T')[0],
      travelers: row.travelers,
      createdAt: row.created_at
    };

    return NextResponse.json(newTrip, { status: 201 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
