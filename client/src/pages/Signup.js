import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { supabase } from "../supabase";

function Signup() {

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword,setConfirmPassword] = useState("");

  const navigate =
    useNavigate();

  const handleSignup =
    async (e) => {

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
          navigate("/login");
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
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <input
          type="email"
          autoComplete="off"
          spellCheck="false"
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

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <button
          type="submit"
          style={buttonStyle}
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
          to="/login"
          style={{
            color: "#90cdf4",
          }}
        >
          Login
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

export default Signup;