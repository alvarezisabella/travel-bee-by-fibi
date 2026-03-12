import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

//Debug check
console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SUPABASE KEY:", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);

// This is the helper Supabase essentially gave 
function createSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createSupabaseMiddlewareClient(request, response);

  // Refresh session if needed 
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
// import { createServerClient, type CookieOptions } from "@supabase/ssr";
// import { type NextRequest, NextResponse } from "next/server";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// export const createClient = (request: NextRequest) => {
//   // Create an unmodified response
//   let supabaseResponse = NextResponse.next({
//     request: {
//       headers: request.headers,
//     },
//   });

//   const supabase = createServerClient(
//     supabaseUrl!,
//     supabaseKey!,
//     {
//       cookies: {
//         getAll() {
//           return request.cookies.getAll()
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
//           supabaseResponse = NextResponse.next({
//             request,
//           })
//           cookiesToSet.forEach(({ name, value, options }) =>
//             supabaseResponse.cookies.set(name, value, options)
//           )
//         },
//       },
//     },
//   );

//   return supabaseResponse
// };
