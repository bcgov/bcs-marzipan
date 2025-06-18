import {
  Link,
  Input,
  Avatar,
  Button,
  Text,
  Tooltip,
} from "@fluentui/react-components";
import {
  QuestionCircle24Regular,
  Alert24Regular,
  Add24Regular,
} from "@fluentui/react-icons";
import { RightDrawer } from "../components/RightDrawer";
import { OverviewPage } from "../pages/OverviewPage";
import * as React from "react";


export const HeaderSearch = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <>
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid #e0e0e0",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Left: Title and Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <Text size={500} weight="semibold">Marzipan</Text>

        <Input
          placeholder="Enter keyword, activity ID, or location"
          style={{ width: "320px" }}
        />
      </div>

      {/* Right: Icons + Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

        <div>
          {/* <img src="/bc-logo.png" alt="BC Logo" style={{ marginBottom: "16px", height: "32px" }} /> */}
            <Button appearance="primary" onClick={() => setDrawerOpen(true)} icon={<Add24Regular />}>
                Add new
            </Button>
        </div>
        <Tooltip content="Notifications" relationship="label">
          <Button icon={<Alert24Regular />} appearance="subtle" />
        </Tooltip>
        <Tooltip content="Help" relationship="label">
          <Button icon={<QuestionCircle24Regular />} appearance="subtle" />
        </Tooltip>
        <Avatar name="HS" color="colorful" />
      </div>
    </header>
    <RightDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Add New">
      <OverviewPage />
    </RightDrawer>
    </>
  );
};
