import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import WebSocket from 'ws';

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket;
}

const DEFAULT_SUPABASE_URL = 'https://botwoojfvjzwjzivfzet.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdHdvb2pmdmp6d2p6aXZmemV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTkxMDIsImV4cCI6MjEwNTU5NTEwMn0.NlpLp1Q1If9USx6i6z8Zv3ZdCWcpEONcOX8dxpEDmM8';

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Anon client — used for user-scoped operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});


// Admin client — only used server-side for admin operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : supabase; // fallback to anon if no service key

export default supabase;
