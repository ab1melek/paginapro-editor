"use client";

import styles from "../app/styles/button.module.css";

export default function Button({ label, onClick, className }) {
    return (
        <button onClick={onClick} className={`${styles.button} ${className || ""}`}>
            {label}
        </button>
    );
}