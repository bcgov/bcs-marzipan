import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';

import Header from './Header/Header';
import { Sidebar } from './Sidebar';
import { SidebarInset } from './ui/sidebar';

export const Layout = () => {
  return (
    <Sidebar>
      <Header />
      <SidebarInset
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
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
      </SidebarInset>
    </Sidebar>
  );
};
