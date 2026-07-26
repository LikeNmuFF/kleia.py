import { login, signInWithGoogle, signInWithGitHub } from './actions'

export default function LoginPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          formAction={login}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </form>
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full border rounded-lg py-2 hover:bg-gray-50"
            >
              Google
            </button>
          </form>
          <form action={signInWithGitHub}>
            <button
              type="submit"
              className="w-full border rounded-lg py-2 hover:bg-gray-50"
            >
              GitHub
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
