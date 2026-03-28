"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, firstName, lastName, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Signup failed.");
      return;
    }

    router.push("/login");
  };

  return (
    // Full screen overlay with dark background
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#D4DADF]"
      onClick={() => router.push("/")}
    >
      {/* Modal — stop clicks from bubbling to the overlay */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col gap-4 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-1">
          <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
          <p className="text-sm text-gray-500 mt-1">Join TravelBee and start planning</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {/* First + Last Name */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all"
              required
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all"
              required
            />
          </div>

          {/* Username */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all"
            required
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all"
            required
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all"
            required
          />

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#F5C842] hover:bg-[#e6b93a] text-gray-900 font-semibold text-sm rounded-xl transition-all disabled:opacity-50 mt-1"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-yellow-600 font-medium hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}