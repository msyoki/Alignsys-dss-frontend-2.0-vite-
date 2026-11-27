import React from "react";
import { InlineLoader } from "./LoaderKit";

/** Small wait inside a panel or dialog (same design as Alignsys EDMS). */
const LoadingMini = ({ msg = "Loading…", msg2 }) => <InlineLoader msg={msg} msg2={msg2} />;

export default LoadingMini;
