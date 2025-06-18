import { makeStyles, shorthands, tokens } from "@fluentui/react-components";
import React from "react";

const useStyles = makeStyles({
  section: {
    ...shorthands.padding("24px"),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    marginBottom: "24px",
    boxShadow: tokens.shadow4,
        display: "flex",
    flexDirection: "column",
    rowGap: "16px",
    padding: "24px",
    borderRadius: "8px",
  },
});

export const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const styles = useStyles();
  return (
    <div className={styles.section}>
      <h3>{title}</h3>
      {children}
    </div>
  );
};
