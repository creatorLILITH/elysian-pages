import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
function AdminRoute({ children }) {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    useEffect(() => {
        const checkAdmin = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                navigate("/login");
                return;
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (error || profile?.role !== "admin") {
                navigate("/dashboard");
                return;
            }

            setChecking(false);
        };

        checkAdmin();
    }, [navigate]);

    if (checking) {
        return <p>Checking permissions...</p>;
    }

    return children;
}

export default AdminRoute;