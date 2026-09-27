import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ConfirmProvider } from './ui/Confirm';

/** Ambient aurora backdrop, fixed behind all page content. */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-ink-950" />
      <div className="animate-aurora absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-halo-1 blur-[120px]" />
      <div className="animate-aurora-slow absolute -right-48 top-1/3 h-[38rem] w-[38rem] rounded-full bg-halo-2 blur-[130px]" />
      <div className="animate-aurora absolute -bottom-52 left-1/3 h-[30rem] w-[30rem] rounded-full bg-halo-3 blur-[120px]" />
      <div className="screentone absolute inset-0 opacity-[0.35]" />
    </div>
  );
}

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <Backdrop />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-sakura-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <Navbar />

      <main
        key={location.pathname}
        id="main"
        className="mx-auto w-full max-w-7xl flex-1 animate-fade-up px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      >
        <ConfirmProvider>
          <Outlet />
        </ConfirmProvider>
      </main>

      <Footer />
    </div>
  );
}
