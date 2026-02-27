import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-8">Medhashree</h2>

      <nav className="space-y-4">
        <Link to="/" className="block hover:text-gray-300">
          Home
        </Link>
        <Link to="/dashboard" className="block hover:text-gray-300">
          Dashboard
        </Link>
      </nav>
    </div>
  );
}