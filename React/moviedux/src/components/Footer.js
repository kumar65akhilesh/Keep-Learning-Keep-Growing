import React from "react";
import "../styles.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="footer">
      <p className="footer-text">
        &copy; {currentYear} Moviedux, All rights reserved.
      </p>
    </footer>
  );
}
