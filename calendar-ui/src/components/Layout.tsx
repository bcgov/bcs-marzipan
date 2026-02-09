import React, { useState } from 'react';
import Header from './Header/Header';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

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
          <Outlet />
        </main>
      </div>
    </div>
  );
};
