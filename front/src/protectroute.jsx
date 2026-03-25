import { Navigate } from "react-router-dom";
import { safeJsonParse } from "./utils.js";

export default function Protection({ children }) {
  const userInformations = safeJsonParse(localStorage.getItem("user"), null);

  if (!userInformations?.userid) {
    return <Navigate to="/" replace />;
  }

  return children;
}
