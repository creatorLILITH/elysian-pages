import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

import dreamer from "../assets/Profile/dreamer.png";
import bookworm from "../assets/Profile/the-bookworm.png";
import nightOwl from "../assets/Profile/night-owl.png";
import storyteller from "../assets/Profile/storyteller.png";

import dreamerMale from "../assets/Profile/dreamer-male-version.png";
import bookwormMale from "../assets/Profile/the-bookworm-male-version.png";
import nightowlMale from "../assets/Profile/night-owl-male-version.png";
import storytellerMale from "../assets/Profile/storyteller-male-version.png";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAvatarChoices, setShowAvatarChoices] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const avatarChoices = [
    {
      name: "Dreamer",
      value: "dreamer",
      image: dreamer,
    },
    {
      name: "Dreamer",
      value: "dreamer-male",
      image: dreamerMale,
    },
    {
      name: "Bookworm",
      value: "bookworm",
      image: bookworm,
    },
    {
      name: "Bookworm",
      value: "bookworm-male",
      image: bookwormMale,
    },
    {
      name: "Night Owl",
      value: "night-owl",
      image: nightOwl,
    },
    {
      name: "Night Owl",
      value: "night-owl-male",
      image: nightowlMale,
    },
    {
      name: "Storyteller",
      value: "storyteller",
      image: storyteller,
    },
    {
      name: "Storyteller",
      value: "storyteller-male",
      image: storytellerMale,
    },
  ];

  useEffect(() => {
  const loadProfile = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar, role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log(error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  loadProfile();
},[navigate]);

  const handleAvatarChange = async (avatarValue) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          avatar: avatarValue,
        })
        .eq("id", user.id);

      if (error) {
        console.log(error);
        alert("Unable to change profile image.");
        return;
      }

      setProfile({
        ...profile,
        avatar: avatarValue,
      });

      setShowAvatarChoices(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handlePasswordChange = async () => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    alert("Please fill in all password fields.");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("New passwords do not match.");
    return;
  }

  if (newPassword.length < 6) {
    alert("New Password must be at least 6 characters long.");
    return;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

    if (signInError) {
      alert("Current password is incorrect.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.log(error);
      alert("Unable to change password.");
      return;
    }

    alert("Password changed successfully.");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  } catch (error) {
    console.log(error);
    alert("Something went wrong while changing your password.");
  }
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    navigate("/");
  };

  const getAvatarImage = () => {
    const selectedAvatar = avatarChoices.find(
      (avatar) => avatar.value === profile.avatar
    );

    return selectedAvatar ? selectedAvatar.image : dreamer;
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={pageStyle}>
        <p>Unable to load your profile.</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={profileCardStyle}>

        {/* Profile Image */}
        <img
          src={getAvatarImage()}
          alt="Profile"
          style={avatarStyle}
        />

        {/* Username */}
        <h1 style={nameStyle}>{profile.username}</h1>

        {/* Role */}
        <p style={roleStyle}>{profile.role}</p>
        {/* Change Profile Image */}
        <button
          style={changeButtonStyle}
          onClick={() => setShowAvatarChoices(!showAvatarChoices)}
        >
          Change Profile Image
        </button>
        <div style={dividerStyle}></div>

        <p style={welcomeStyle}>
          Welcome to your Personal Corner of Elysian Pages.
        </p>

        {/* Avatar Choices */}
        {showAvatarChoices && (
          <div style={avatarChoicesContainerStyle}>
            <h2 style={choicesTitleStyle}>
              Choose Your Profile Image
            </h2>

            <div style={avatarGridStyle}>
              {avatarChoices.map((avatar) => (
                <div
                  key={avatar.value}
                  style={avatarOptionStyle}
                  onClick={() => handleAvatarChange(avatar.value)}
                >
                  <img
                    src={avatar.image}
                    alt={avatar.name}
                    style={choiceImageStyle}
                  />

                  <p style={avatarNameStyle}>
                    {avatar.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/*Change Password*/}
        <div style={passwordSectionStyle}>
          <button style={passwordToggleStyle} onClick={()=>
            setShowPasswordForm(!showPasswordForm)
          }>Change Password</button>
          {showPasswordForm &&(
            <div style={passwordFormStyle}>
              <input type="password"
              placeholder="Current Password"
              value={currentPassword} onChange={(e)=>
                setCurrentPassword(e.target.value)}
                style={passwordInputStyle}/>
              <input type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e)=>setNewPassword(e.target.value)}
              style={passwordInputStyle}/>
              <input type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e)=>setConfirmPassword(e.target.value)}
              style={passwordInputStyle}/>
              <button onClick={handlePasswordChange}
              style={passwordSubmitStyle}>
                Submit New Password
              </button>
        </div>
          )}
      </div>
        {/* Logout */}
        <button
          style={logoutButtonStyle}
          onClick={handleLogout}
        >
          Log-Out
        </button>

      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  paddingTop: "50px",
  backgroundColor: "#2b1b0e",
  color: "#f5e6d3",
};

const profileCardStyle = {
  width: "80%",
  maxWidth: "900px",
  textAlign: "center",
};

const avatarStyle = {
  width: "180px",
  height: "180px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid #b98245",
};

const nameStyle = {
  marginTop: "25px",
  marginBottom: "5px",
};

const roleStyle = {
  marginTop: "0",
};

const dividerStyle = {
  borderTop: "1px solid #8f6338",
  margin: "25px 0",
};

const welcomeStyle = {
  marginBottom: "25px",
};

const changeButtonStyle = {
  padding: "10px 18px",
  borderRadius: "12px",
  border: "1px solid #b98245",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};

const avatarChoicesContainerStyle = {
  marginTop: "30px",
};

const choicesTitleStyle = {
  marginBottom: "20px",
};

const avatarGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
};

const avatarOptionStyle = {
  cursor: "pointer",
  textAlign: "center",
};

const choiceImageStyle = {
  width: "150px",
  height: "150px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid #8f6338",
};

const avatarNameStyle = {
  marginTop: "8px",
};

const passwordSectionStyle={
  marginTop: "30px",
};

const passwordToggleStyle={
  padding:"8px 16px",
  borderRadius:"10px",
  border:"1px solid #b98245",
  background:"transparent",
  color:"inherit",
  cursor:"pointer",
};

const passwordFormStyle={
  marginTop:"15px",
  display:"flex",
  flexDirection:"column",
  alignItems:"center",
  gap:"12px",
};

const passwordSubmitStyle={
  padding:"10px 18px",
  borderRadius:"10px",
  border:"1px solid #b98245",
  background:"transparent",
  color:"#f5e6d3",
  cursor:"pointer",
};

const passwordInputStyle={
  width:"280px",
  padding:"10px 12px",
  borderRadius:"8px",
  border:"1px solid #8f6338",
  backgroundColor:"#1f140b",
  color:"#f5e6d3",
  boxSizing:"border-box",
};

const logoutButtonStyle = {
  marginTop: "40px",
  padding: "10px 25px",
  borderRadius: "12px",
  border: "1px solid #b98245",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};

export default Profile;