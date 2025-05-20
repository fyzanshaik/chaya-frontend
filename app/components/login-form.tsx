"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/providers/auth-provider";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui//label";
import { Input } from "@/components/ui//input";
import { Button } from "@/components/ui//button";
import { cn } from "@/lib/utils";

if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

type LoginFormProps = Readonly<React.ComponentPropsWithoutRef<"form">>;

export function LoginForm({ className, ...props }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // VVVVVV  CALL YOUR NEXT.JS API ROUTE VVVVVV
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        // `credentials: "include"` is generally not needed when fetching from
        // the same domain (your Next.js frontend to your Next.js API route).
        // The browser handles cookies automatically for same-domain requests.
      });

      const data = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        throw new Error(data.message ?? "Invalid credentials");
      }

      // `data` should now be { user: { ... } } from your Next.js API route
      console.log("Data from Next.js API route:", data);
      setUser(data.user); // Update AuthContext
      console.log("User data set in AuthContext");
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "An error occurred during login");
      } else {
        setError("An error occurred during login");
      }
      console.error("Login form error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className={cn(
        "flex flex-col gap-6 p-4 md:p-6 bg-card rounded-lg shadow",
        className,
      )}
      {...props}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-primary">
          Login to your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            required
            className="border border-input focus:ring-primary focus:border-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
          </div>
          <Input
            id="password"
            type="password"
            required
            className="border border-input focus:ring-primary focus:border-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </div>
    </form>
  );
}
