import { Outlet } from 'react-router-dom';
import { Suspense, useState } from 'react';

import Header from './Header/Header';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <Header />
      <div style={{ display: 'flex' }}>
        <Sidebar isOpen={isOpen} onToggle={() => setIsOpen((v) => !v)} />
        <main
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <Suspense
            fallback={
              <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center">
                Loading…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};
