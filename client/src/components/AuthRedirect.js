import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import LandingPage from "../pages/LandingPage";
function AuthRedirect(){
    const navigate=useNavigate();
    const [showLanding,setShowLanding]=useState(false);
    useEffect(()=>{
        const checkUser=async()=>{
            const{data:{ user },}=await supabase.auth.getUser();
            if (!user){
                setShowLanding(true);
                return;
            }
            const {data:profile,error}=await supabase
            .from("profiles")
            .select("role")
            .eq("id",user.id)
            .single();
            if (error){
                console.log(error);
                navigate("/dashboard");
                return;
            }
            if (profile.role==="admin"){
                navigate("/admin");
            }
            else{
                navigate("/dashboard");
            }
        };
        checkUser();
    },[navigate]);
    if (showLanding){
        return <LandingPage />;
    }
    return null;
}
export default AuthRedirect;