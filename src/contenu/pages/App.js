import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header Section */}
      <header className="bg-blue-600 text-white py-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl font-bold">Bienvenue sur ma page React + Tailwind</h1>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-lg text-gray-700 mb-8">
            Cette page est construite avec **React** et **Tailwind CSS**.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300">
            Cliquez ici
          </button>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="bg-gray-800 text-green py-4">
        <div className="container mx-auto text-center">
          <p className="text-sm">© 2025 Ma Page Web. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
