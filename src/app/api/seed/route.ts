import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        country VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        travelers JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return NextResponse.json({ message: 'Database seeded successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
