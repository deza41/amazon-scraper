// import { NextResponse } from 'next/server';
// import { get } from '@vercel/edge-config';

// export const config = { matcher: '/welcome' };

// export async function middleware() {
//   const greeting = await get('greeting');
//   // NextResponse.json requires at least Next v13.1 or
//   // enabling experimental.allowMiddlewareResponseBody in next.config.js
//   return NextResponse.json(greeting);
// }


// import { NextResponse } from 'next/server'

// export function middleware(request) {
//     let url = request.nextUrl.clone()
//     const hostname = url.pathname.startsWith("/ingest/static/") ? 'us-assets.i.posthog.com' : 'us.i.posthog.com'
//     const requestHeaders = new Headers(request.headers)

//     requestHeaders.set('host', hostname)

//     url.protocol = 'https'
//     url.hostname = hostname
//     url.port = 443
//     url.pathname = url.pathname.replace(/^\/ingest/, '');

//     return NextResponse.rewrite(url, {
//         headers: requestHeaders,
//     })
// }

// export const config = {
//     matcher: '/ingest/:path*',
// }