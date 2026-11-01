/**
 * BEXA AI — Login page
 */
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export const metadata = {
  title: "Login — BEXA AI",
  description: "Login to BEXA AI Admin Panel",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center space-y-4">
          <Link href="/login" className="inline-block">
            <h1 className="text-4xl font-bold text-white">BEXA AI</h1>
          </Link>
          <p className="text-sm text-gray-400">Admin Management System</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}