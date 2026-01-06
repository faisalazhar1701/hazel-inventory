import React from "react";
import { Navigate } from "react-router-dom";

const AuthProtected = (props: any) => {
  // Minimal route protection: check localStorage for "auth" key
  const auth = localStorage.getItem("auth");

  if (!auth) {
    return <Navigate to="/login" />;
  }

  return <>{props.children}</>;
};

export default AuthProtected;