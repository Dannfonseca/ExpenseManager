import { Outlet } from "react-router-dom";

// A única função deste componente é renderizar o Layout, que fará a verificação.
const ProtectedRoute = () => {
  return <Outlet />;
};

export default ProtectedRoute;