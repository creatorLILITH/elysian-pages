import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import AuthCard from "../components/AuthCard";

function Login() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const navigate =
    useNavigate();

  const handleLogin =
    async (e) => {

      e.preventDefault();

      try {

        const res =
          await fetch(
            "http://localhost:5000/login",

            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  email,
                  password,
                }),
            }
          );

        const data =
          await res.json();

        if (res.ok) {

          localStorage.setItem(
            "user",

            JSON.stringify(
              data.user
            )
          );

          if (data.user.role==="admin"){
            navigate("/admin");
          }
          else{
            navigate("/dashboard")
          };

        } else {

          alert(
            data.error
          );
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
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <button
          type="submit"
          style={buttonStyle}
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
          to="/signup"
          style={{
            color: "#90cdf4",
          }}
        >
          Sign Up
        </Link>

      </p>

    </AuthCard>
  );
}

const inputStyle = {

  width: "93%",

  padding: "14px",

  marginBottom: "18px",

  borderRadius: "12px",

  border: "none",

  outline: "none",

  fontSize: "16px",
};

const buttonStyle = {

  display: "block",

  width: "100%",

  padding: "14px",

  borderRadius: "12px",

  border: "none",

  cursor: "pointer",

  background: "#a47148",

  color: "white",

  fontSize: "16px",

  fontWeight: "bold",
};

export default Login;