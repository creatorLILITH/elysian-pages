function AuthCard({
  title,
  children,
}) {

  return (
    <div
      style={{
        minHeight: "100vh",

        display: "flex",

        justifyContent: "center",

        alignItems: "center",

        background:
          "linear-gradient(135deg, #2b1d0e, #4a3421, #1e140d)",

        padding: "20px",

        fontFamily:
          "'Playfair Display', serif",
      }}
    >
      <div
        style={{
          width: "100%",

          maxWidth: "430px",

          background:
            "rgba(255, 248, 220, 0.08)",

          backdropFilter:
            "blur(10px)",

          borderRadius: "24px",

          padding: "45px",

          boxShadow:
            "0 8px 40px rgba(0,0,0,0.45)",

          border:
            "1px solid rgba(255,215,150,0.2)",

          color: "#f8e7c7",
        }}
      >
        <h1
          style={{
            textAlign: "center",

            marginBottom: "35px",

            fontSize: "42px",

            letterSpacing: "1px",

            color: "#f5d28c",
          }}
        >
          {title}
        </h1>

        {children}
      </div>
    </div>
  );
}

export default AuthCard;