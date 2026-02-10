import React from 'react';
import logo from '../../assets/Logo.svg';
import { Avatar, Button, Tooltip } from '@fluentui/react-components';
import { Alert24Regular } from '@fluentui/react-icons';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="box-border flex h-14 w-full items-center border-b-2 border-[#f4f4f4] px-20 py-2">
      <Link to="/">
        <img src={logo} alt="Logo" className="mr-4 h-10" />
      </Link>

      <div className="ml-auto flex items-center gap-4">
        <Tooltip content="Notifications" relationship="label">
          <Button icon={<Alert24Regular />} appearance="subtle" />
        </Tooltip>
        <Avatar name="HS" color="colorful" />
      </div>
    </header>
  );
};

export default Header;
