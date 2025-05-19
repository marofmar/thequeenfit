import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
  console.log("URL:", supabaseUrl);
  console.log("Key:", supabaseAnonKey);
}

// Create a single supabase client for interacting with your database
const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);

// Test the connection
supabaseClient
  .from("wods")
  .select("count")
  .then(({ data, error }) => {
    if (error) {
      console.error("Supabase connection test failed:", error);
    } else {
      console.log("Supabase connection successful");
    }
  });

export const supabase = supabaseClient;
