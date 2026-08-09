import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "./Loader";

const ProtectedRoute = ({ children }) => {

    const { isAuthenticated, loading } = useSelector(
        (store) => store.authReducer
    );


    if (loading) {
        return <Loader/>
    }


    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }


    return children;
};

export default ProtectedRoute;