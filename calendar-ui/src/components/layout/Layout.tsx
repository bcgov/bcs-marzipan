import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';

import { SidebarInset } from '../ui/sidebar';
import Header from './Header';
import { PageContainer } from './PageContainer';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <Sidebar>
      <Header />
      <SidebarInset className="min-w-0 overflow-auto">
        <Suspense
          fallback={
            <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center">
              Loading…
            </div>
          }
        >
          <PageContainer>
            <Outlet />
          </PageContainer>
        </Suspense>
      </SidebarInset>
    </Sidebar>
  );
};
