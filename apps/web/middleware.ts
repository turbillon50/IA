import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server';
const clerk = clerkMiddleware();
export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (process.env.NEON_AUTH_BASE_URL) return NextResponse.next();
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) return NextResponse.next();
  return clerk(request as unknown as Parameters<typeof clerk>[0], event as unknown as Parameters<typeof clerk>[1]);
}
export const config = { matcher: ['/((?!_next|.*\\..*).*)', '/api/(.*)'] };
