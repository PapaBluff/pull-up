import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const location = searchParams.get('location') || ''

  const supabase = await createClient()

  let dbQuery = supabase
    .from('profiles')
    .select('id, full_name, username, category, location, avatar_url, tags')

  if (category) {
    dbQuery = dbQuery.ilike('category', `%${category}%`)
  }

  if (query) {
    dbQuery = dbQuery.or(`full_name.ilike.%${query}%,category.ilike.%${query}%,bio.ilike.%${query}%`)
  }

  if (location) {
    dbQuery = dbQuery.ilike('location', `%${location}%`)
  }

  const { data: creators, error } = await dbQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ creators })
}
