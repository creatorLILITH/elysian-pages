"use client";

import { useEffect, useState } from "react";
import { useReveal } from "@/lib/motion";
import AppNav from "@/components/ui/AppNav";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

import dreamer from "@/assets/Profile/dreamer.png";
import bookworm from "@/assets/Profile/the-bookworm.png";
import nightOwl from "@/assets/Profile/night-owl.png";
import storyteller from "@/assets/Profile/storyteller.png";

import dreamerMale from "@/assets/Profile/dreamer-male-version.png";
import bookwormMale from "@/assets/Profile/the-bookworm-male-version.png";
import nightowlMale from "@/assets/Profile/night-owl-male-version.png";
import storytellerMale from "@/assets/Profile/storyteller-male-version.png";
import type { Profile } from "@/lib/types";

function ProfilePage() {
  const pageRef = useReveal<HTMLDivElement>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAvatarChoices, setShowAvatarChoices] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const router = useRouter();

  const avatarChoices = [
    {
      name: "Dreamer",
      value: "dreamer",
      image: dreamer.src,
    },
    {
      name: "Dreamer",
      value: "dreamer-male",
      image: dreamerMale.src,
    },
    {
      name: "Bookworm",
      value: "bookworm",
      image: bookworm.src,
    },
    {
      name: "Bookworm",
      value: "bookworm-male",
      image: bookwormMale.src,
    },
    {
      name: "Night Owl",
      value: "night-owl",
      image: nightOwl.src,
    },
    {
      name: "Night Owl",
      value: "night-owl-male",
      image: nightowlMale.src,
    },
    {
      name: "Storyteller",
      value: "storyteller",
      image: storyteller.src,
    },
    {
      name: "Storyteller",
      value: "storyteller-male",
      image: storytellerMale.src,
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
        router.push("/login");
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
},[router]);

  const handleAvatarChange = async (avatarValue: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
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
      } as Profile);

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
      router.push("/login");
      return;
    }

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email: user.email!,
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
    router.push("/");
  };

  const getAvatarImage = () => {
    if (!profile) return dreamer.src;

    const selectedAvatar = avatarChoices.find(
      (avatar) => avatar.value === profile.avatar
    );

    return selectedAvatar ? selectedAvatar.image : dreamer.src;
  };

  if (loading) {
    return (
      <div className="page" ref={pageRef}><AppNav />
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page" ref={pageRef}><AppNav />
        <p>Unable to load your profile.</p>
      </div>
    );
  }

  return (
    <div className="page" ref={pageRef}><AppNav />
      <div className="profile-panel surface panel--lg">

        {/* Profile Image */}
        <img
          src={getAvatarImage()}
          alt="Profile"
          className="profile-avatar"
        />

        {/* Username */}
        <h1 className="display t-title" data-reveal>{profile.username}</h1>

        {/* Role */}
        <p className="eyebrow">{profile.role}</p>
        {/* Change Profile Image */}
        <button
          className="btn btn--secondary"
          onClick={() => setShowAvatarChoices(!showAvatarChoices)}
        >
          Change Profile Image
        </button>
        <div className="divider"></div>

        <p className="section__desc">
          Welcome to your Personal Corner of Elysian Pages.
        </p>

        {/* Avatar Choices */}
        {showAvatarChoices && (
          <div className="section">
            <h2 className="section__title">
              Choose Your Profile Image
            </h2>

            <div className="avatar-grid">
              {avatarChoices.map((avatar) => (
                <button
                  type="button"
                  key={avatar.value}
                  className="avatar-option"
                  onClick={() => handleAvatarChange(avatar.value)}
                >
                  <img
                    src={avatar.image}
                    alt={avatar.name}
                    className="avatar-choice"
                  />

                  <p className="small">
                    {avatar.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/*Change Password*/}
        <div className="section">
          <button className="btn btn--secondary" onClick={()=>
            setShowPasswordForm(!showPasswordForm)
          }>Change Password</button>
          {showPasswordForm &&(
            <div className="password-form">
              <input type="password"
              placeholder="Current Password" aria-label="Current Password"
              value={currentPassword} onChange={(e)=>
                setCurrentPassword(e.target.value)}
                className="input"/>
              <input type="password"
              placeholder="New Password" aria-label="New Password"
              value={newPassword}
              onChange={(e)=>setNewPassword(e.target.value)}
              className="input"/>

              <input type="password"
              placeholder="Confirm New Password" aria-label="Confirm New Password"
              value={confirmPassword}
              onChange={(e)=>setConfirmPassword(e.target.value)}
              className="input"/>
              <button onClick={handlePasswordChange}
              className="btn btn--primary">
                Submit New Password
              </button>
        </div>
          )}
      </div>
        {/* Logout */}
        <button
          className="btn btn--secondary"
          onClick={handleLogout}
        >
          Log-Out
        </button>

      </div>
    </div>
  );
}

export default ProfilePage;
