"use client";
import React, { useState } from "react";

//The code here is none functional for now 
//creates an account
//const SignupPage: React.FC = () => {
export default function SignupPage(){
  const [email, setEmail] = useState("");
  //const [username, setUsername] = useState("");
  //const [password, setPassword] = useState("");

 // const handleSubmit = (e: React.FormEvent) => {
    //e.preventDefault();

    // Placeholder (no functionality yet)
    //console.log("Signup attempt:", {
      //email,
     // username,
      //password
    

   // alert("Signup functionality not implemented yet.");
  

  //code for the frontend
  return (
    <div style={styles.container}>
      <form style={styles.form} >
        <h2>Create an Account</h2>

        <input
          type="text"
          placeholder="Username"
          //value={username}
          //onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          //value={password}
          //onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Sign Up
        </button>

        <p style={styles.note}>
          Signup is currently disabled.
        </p>
      </form>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f4f4f4"
  },
  form: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column" as const,
    width: "300px",
    gap: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  input: {
    padding: "10px",
    fontSize: "14px"
  },
  button: {
    padding: "10px",
    backgroundColor: "#333",
    color: "white",
    border: "none",
    cursor: "pointer"
  },
  note: {
    fontSize: "12px",
    color: "gray",
    textAlign: "center" as const
  }
};

//export default SignupPage;