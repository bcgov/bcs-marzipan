import { Basic } from "../components/Sidebar";
import { HeaderSearch } from "../components/HeaderSearch";
import { EventTable } from "../components/EventTable";

export const HomePage = () => {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar Navigation */}
      <Basic />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Header Search */}
        <HeaderSearch />

        {/* Content */}
        <div style={{ padding: "24px", overflowY: "auto", backgroundColor: "#fafafa", flex: 1 }}>
          <EventTable />
        </div>
      </div>
    </div>
  );
};
