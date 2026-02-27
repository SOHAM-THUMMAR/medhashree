export default function Topbar() {
  return (
    <div className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Medhashree</h1>
      <button className="bg-gray-900 text-white px-4 py-2 rounded">
        Logout
      </button>
    </div>
  );
}