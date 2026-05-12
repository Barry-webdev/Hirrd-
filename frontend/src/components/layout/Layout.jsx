// Layout principal — enveloppe toutes les pages protégées
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar  from './Navbar';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      {/* Sidebar fixe à gauche */}
      <Sidebar />

      {/* Zone de contenu principale — décalée de la largeur de la sidebar */}
      <div className="flex flex-col flex-1 ml-64">
        {/* Barre de navigation supérieure */}
        <Navbar />

        {/* Contenu de la page courante */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
