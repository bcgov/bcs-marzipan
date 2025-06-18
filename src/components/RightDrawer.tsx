import * as React from "react";
import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogActions } from "@fluentui/react-components";

export const RightDrawer = ({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}) => (
  <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
    <DialogSurface
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "480px",
        maxWidth: "150vw",
        boxShadow: "0 0 24px rgba(0,0,0,0.2)",
        borderRadius: "0 8px 8px 0",
        background: "white",
        zIndex: 1300,
        transition: "transform 0.3s",
        margin: 0,
      }}
    >
      <DialogBody>
        {title && <DialogTitle>{title}</DialogTitle>}
        {children}
      </DialogBody>
      <DialogActions>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </DialogActions>
    </DialogSurface>
  </Dialog>
);