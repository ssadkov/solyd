import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.redirect('/icon.png', 301)
}
