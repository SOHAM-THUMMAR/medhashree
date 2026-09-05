import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config/api";

// Load from .env (Vite)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function useGoogleAuth({ onSuccess, onError }) {
    const [loading, setLoading] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);




    // Load Google script
    useEffect(() => {
        if (window.google?.accounts?.id) {
            const timer = setTimeout(() => setScriptLoaded(true), 0);
            return () => clearTimeout(timer);
        }

        const existing = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
        );

        if (existing) {
            existing.addEventListener("load", () => setScriptLoaded(true));
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;

        script.onload = () => setScriptLoaded(true);

        script.onerror = () => {
            console.error("Failed to load Google script");
            onError?.("Google SDK failed to load");
        };

        document.head.appendChild(script);
    }, [onError]);

    // Handle Google response
    const handleCredentialResponse = useCallback(async (response) => {
        if (!response.credential) {
            onError?.("Google sign-in cancelled");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/google`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    idToken: response.credential, // FIXED
                }),
            });

            const data = await res.json();

            if (data.success) {
                onSuccess?.(data);
            } else {
                onError?.(data.error || "Google authentication failed");
            }
        } catch (err) {
            console.error(err);
            onError?.("Server connection failed");
        } finally {
            setLoading(false);
        }
    }, [onSuccess, onError]);

    // Initialize Google client
    useEffect(() => {
        if (!scriptLoaded || !window.google?.accounts?.id) return;

        if (!GOOGLE_CLIENT_ID) {
            console.error("Missing GOOGLE CLIENT ID");
            onError?.("Google Client ID not configured");
            return;
        }

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
        });
    }, [scriptLoaded, handleCredentialResponse, onError]);

    // Trigger login
    const handleGoogleLogin = useCallback(() => {
        if (!window.google?.accounts?.id) {
            onError?.("Google not ready yet");
            return;
        }

        window.google.accounts.id.prompt((notification) => {
            if (
                notification.isNotDisplayed() ||
                notification.isSkippedMoment()
            ) {
                const btnDiv = document.createElement("div");
                btnDiv.style.display = "none";
                document.body.appendChild(btnDiv);

                window.google.accounts.id.renderButton(btnDiv, {
                    type: "standard",
                    size: "large",
                });

                const btn =
                    btnDiv.querySelector('[role="button"]') ||
                    btnDiv.querySelector("div[tabindex]");

                if (btn) btn.click();

                setTimeout(() => btnDiv.remove(), 3000);
            }
        });
    }, [onError]);

    return {
        loading,
        scriptLoaded,
        handleGoogleLogin,
    };
}