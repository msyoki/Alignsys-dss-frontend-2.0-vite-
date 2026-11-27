import React, { memo } from "react";
import PropTypes from "prop-types";
import Backdrop from "@mui/material/Backdrop";
import { SigningCard, StatusCard, TopProgress } from "./LoaderKit";
import alignsysLogo from "../../images/ZFBLU.webp";

/**
 * Blocking "please wait" overlay (signing, loading, saving): the page dimmed
 * behind the same backdrop as the other dialogs, and a small card saying what
 * is happening.
 *
 * Props: opendialogloading, msg (title, e.g. "Signing document"), detail (optional
 * one-line explanation), percentage (optional 0-100: shows real progress),
 * variant: "default" (thin progress line along the top + status card) or
 * "signing" (a document page being signed and sealed, the file name and the
 * Alignsys logo). fileName: optional, shown on the signing card.
 */
function LoadingDialog({ opendialogloading = false, msg = "Processing", detail, percentage, variant = "default", fileName }) {
  const hasPercentage = typeof percentage === "number" && !Number.isNaN(percentage);
  // Callers sometimes pass "Signing Document..." - end with one tidy ellipsis.
  const title = `${(msg || "Processing").replace(/[.…\s]+$/, "")}…`;
  const subtitle = detail || "Please keep this page open until it finishes.";

  return (
    <Backdrop
      open={opendialogloading}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2000,
        // Same dimmed backdrop as every other dialog (MUI's default), not a white wash.
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        flexDirection: "column",
      }}
    >
      {variant === "signing" ? (
        <SigningCard title={title} subtitle={subtitle} fileName={fileName} logo={alignsysLogo} />
      ) : (
        <>
          <TopProgress fixed value={hasPercentage ? percentage : undefined} />
          <StatusCard
            title={title}
            subtitle={subtitle}
            percentage={hasPercentage ? percentage : undefined}
          />
        </>
      )}
    </Backdrop>
  );
}

LoadingDialog.propTypes = {
  opendialogloading: PropTypes.bool,
  msg: PropTypes.string,
  detail: PropTypes.string,
  percentage: PropTypes.number,
  variant: PropTypes.oneOf(["default", "signing"]),
  fileName: PropTypes.string,
};

export default memo(LoadingDialog);
