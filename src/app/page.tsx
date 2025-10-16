export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-100 to-green-300">
      <h1 className="text-5xl font-extrabold text-green-800">
        🚴‍♂️ Cyklovýlety KHK
      </h1>
      <p className="mt-4 text-lg text-gray-700">
        Tailwind <span className="font-semibold text-green-600">funguje!</span>
      </p>
      <button className="mt-6 rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700 transition">
        Otestovat
      </button>
    </main>
  );
}
