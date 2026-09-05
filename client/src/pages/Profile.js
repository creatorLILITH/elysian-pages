import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./Profile.css";
function Profile(){
    const [profile,setProfile]= useState(null);
    const [loading,setLoading]= useState(true);
    const navigate= useNavigate();
    const handleLogout=async()=>{
        await supabase.auth.signOut();
        localStorage.removeItem("user");
        navigate("/");
    };
    useEffect(()=>{
    const loadProfile=async()=>{
        try{
            const{
                data:{ user },
                error: userError,
            }=await supabase.auth.getUser();
            if (userError){
                console.log(userError);
                navigate("/login");
                return;
            }
            if (!user){
                navigate("/login");
                return;
            }
            const { data,error }=await supabase
            .from("profiles")
            .select("username,avatar,role")
            .eq("id",user.id)
            .single();
            if (error){
                console.log(error);
                return;
            }
            setProfile(data);
        }
        catch (error){
            console.log(error);
        }
        finally{
            setLoading(false);
        }
    };
    loadProfile();
},[navigate]);
    if (loading){
        return(<div className="profile-page">
            <p>Loding your Profile....</p>
        </div>);
    }
    if(!profile){
        return(<div className="profile-page">
            <p>Unable to load your Profile.</p>
        </div>);
    }
    return(<div className="profile-page">
        <div className="profile-container">
            <div style={avatarStyle}>
                {profile.avatar==="dreamer"? "🌙":"👤"}
            </div>
            <h1 style={nameStyle}>
                {profile.username}
            </h1>
            <p style={roleStyle}>
                {profile.role}
            </p>
        </div>
        <div style={dividerStyle}>
        <p style={welcomeStyle}>
            Welcome to your Personal Corner of Elysian Pages.
        </p>
        <button onClick={handleLogout} style={logoutButtonStyle}>
            Log-Out
        </button>
        </div>
    </div>);
}
const avatarStyle={
    width:"120px",
    height:"120px",
    margin:"0 auto 25px",
    borderRadius:"50%",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    background:"#3a2b21",
    fontSize:"55px",
    border:"2px solid #a47148"
};
const nameStyle={
    margin:"0",
    fontSize:"32px",
    fontFamily:"Georgia, serif",
};
const roleStyle={
    marginTop:"8px",
    color:"#c9a27e",
    textTransform:"capitalize",
};
const dividerStyle={
    width:"70%",
    height:"1px",
    background:"#6b4f3a",
    margin:"25px auto",
};
const welcomeStyle={
    color:"#d8c4ae",
    lineHeight:"1.6",
    fontSize:"16px",
};
const logoutButtonStyle={
    marginTop:"20px",
    padding:"10px 24px",
    border:"1px solid #a47148",
    borderRadius:"14px",
    background:"transparent",
    color:"#f8e7c7",
    cursor:"pointer",
    fontFamily:"Georgia,serif",
};
export default Profile;