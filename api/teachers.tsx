
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // We only want to handle GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return new Response(JSON.stringify(teachers), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow requests from any origin
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
