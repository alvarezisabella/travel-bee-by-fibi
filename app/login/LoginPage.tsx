export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {/* Email */}
        <label className="block mb-2 text-gray-700">Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          required
          className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        {/* Password */}
        <label className="block mb-2 text-gray-700">Password</label>
        <input
          type="password"
          placeholder="Your password"
          required
          className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 rounded transition"
        >
          Log In
        </button>

        {/* Optional */}
        <p className="mt-4 text-sm text-center text-gray-500">
          Forgot your password?
        </p>
      </form>
    </div>
  );
}
