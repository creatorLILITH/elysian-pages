"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { supabase } from "@/lib/supabase-client";

function Signup() {

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword,setConfirmPassword] = useState("");

  const router =
    useRouter();

  const handleSignup =
    async (e: FormEvent<HTMLFormElement>) => {

      e.preventDefault();

      if (
        password !==
        confirmPassword
      ) {

        alert(
          "Passwords do not match"
        );

        return;
      }

      try {

        const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      username,
    },
  },
});
        if (error){
          alert(error.message);
        }
        else{
          alert("Signup Successful!");
          router.push("/login");
        }

      } catch (error) {

        console.log(error);

        alert(
          "Signup failed"
        );
      }
    };

  return (

    <AuthCard title="Curate Your Library">

      <form
        onSubmit={handleSignup}
      >

        <input
          type="text"
          placeholder="Username" aria-label="Username"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
          className="input"
        />

        <input
          type="email"
          autoComplete="off"
          spellCheck="false"
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

        <input
          type="password"
          placeholder="Confirm Password" aria-label="Confirm Password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(
              e.target.value
            )
          }
          className="input"
        />

        <button
          type="submit"
          className="btn btn--primary btn--block"
        >
          Sign Up
        </button>

      </form>

      <p
        style={{
          marginTop: "20px",
          textAlign: "center",
        }}
      >
        Already have an Account?{" "}

        <Link
          href="/login"
          style={{
            color: "var(--accent-2)",
          }}
        >
          Login
        </Link>

      </p>

    </AuthCard>
  );
}





export default Signup;
