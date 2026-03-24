"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// design for signup page and routing for signing in
export default function SignupPage() {
  // variables for username, email, password, error message, and loading state
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // handle form submission for signing up
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // calls POST function from api/auth/rignup with user entered username, email, and password
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    // error handling for signup failure
    if (!res.ok) {
      setError(data.error ?? "Signup failed.");
      return;
    }
// on successful signup, redirects user to login page
    router.push("/login");
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center">Create an Account</h2>

        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className = "w-full p-3 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
          style={styles.input}
          required
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className = "w-full p-3 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
          style={styles.input}
          required
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className = "w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
          style={styles.input}
          required
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f4f4f4",
  },
  form: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column" as const,
    width: "300px",
    gap: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  input: {
    padding: "10px",
    fontSize: "14px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#F5C842",
    color: "black",
    border: "none",
    cursor: "pointer",
  },
  error: {
    fontSize: "12px",
    color: "red",
    textAlign: "center" as const,
  },
};
