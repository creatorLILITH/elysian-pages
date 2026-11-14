"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { supabase } from "@/lib/supabase-client";

function Login() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const router =
    useRouter();

  const handleLogin =
    async (e: FormEvent<HTMLFormElement>) => {

      e.preventDefault();

      try {
        const { data,error }=await supabase.auth.signInWithPassword({
          email,password,
        });
        if (error){
          alert(error.message);
        }
        else if (!data.user){
          alert("Login failed");
        }
        else {

  localStorage.setItem("user", JSON.stringify(data.user));

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("email", data.user.email)
    .single();

  if (profileError) {
    console.log(profileError);
    router.push("/dashboard");
    return;
  }

  if (profile.role === "admin") {
    router.push("/admin");
  } else {
    router.push("/dashboard");
  }
}
      } catch (error) {

        console.log(error);

        alert(
          "Login failed"
        );
      }
    };

  return (
    <AuthCard title="Welcome Back">
      <form
        onSubmit={handleLogin}
      >
        <input
          type="email"
          placeholder="Email" aria-label="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="input"
        />

        <input
          type="password"
          placeholder="Password" aria-label="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="input"
        />

        <button
          type="submit"
          className="btn btn--primary btn--block"
        >
          Login
        </button>

      </form>

      <p
        style={{
          marginTop: "20px",
          textAlign: "center",
        }}
      >
        Don't have an account?{" "}

        <Link
          href="/signup"
          style={{
            color: "var(--accent-2)",
          }}
        >
          Sign Up
        </Link>

      </p>

    </AuthCard>
  );
}





export default Login;
