import './globals.css';
import Sidebar from '../components/Sidebar';

export const metadata = {
  title: 'Tracking QHSE – Transport Pétrolier Madagascar',
  description: 'Tableau de bord de suivi et télématique pour flotte de camions-citernes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen bg-dark-900">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
