"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// design for login page and routing for signing in
export default function LoginPage() {
  // variables for email, password, error message, and loading state
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // error/success handling for logging
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // calls POST function from api/auth/login with user entered email and password
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    // error handling for login failure
    if (!res.ok) {
      setError(data.error ?? "Login failed.");
      return;
    }
// on successful login, redirects user to home page
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {/* Email */}
        <label className="block mb-2 text-gray-700">Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        {/* Password */}
        <label className="block mb-2 text-gray-700">Password</label>
        <input
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        {/* Submit */}
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 rounded transition"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
        {/* Optional */}
        <p className="mt-4 text-sm text-center text-gray-500">
          Forgot your password?
        </p>
      </form>
    </div>
  );
}
