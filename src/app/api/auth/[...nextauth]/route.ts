import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const nextAuth = NextAuth(authOptions as any);
export const { handlers, auth } = nextAuth;
export const GET = handlers.GET;
export const POST = handlers.POST;
