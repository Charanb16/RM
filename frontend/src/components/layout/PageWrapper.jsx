import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export const PageWrapper = ({
  children,
  showSidebar = false,
  maxWidth = 'default',
  className = '',
}) => {
  const maxWidthClasses = {
    narrow: 'max-w-4xl',
    default: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 flex flex-col relative selection:bg-brand-amber selection:text-navy-950 overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[140px]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      </div>

      {/* Main sticky navigation */}
      <Navbar />

      {/* Main content body */}
      <div className="flex-1 flex relative z-10">
        {showSidebar && <Sidebar />}

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${className}`}>
          <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageWrapper;
