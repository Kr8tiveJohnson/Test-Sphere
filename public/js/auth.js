// public/js/auth.js

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector("#login-view form");
    const signupForm = document.querySelector("#signup-view form");

    // ==========================================
    // 1. INTERACTIVE LOGIN HANDLING
    // ==========================================
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Stop standard page refreshing behavior

            const email = loginForm.querySelector("input[type='email']").value;
            const password = loginForm.querySelector("input[type='password']").value;

            try {
                const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    // Redirect the user to their specific system interface based on database role
                    if (data.role === "admin") {
                        window.location.href = "http://127.0.0.1:5000/admin/dashboard";
                    } else if (data.role === "lecturer") {
                        window.location.href = "http://127.0.0.1:5000/lecturer/builder";
                    } else if (data.role === "student") {
                        window.location.href = "http://127.0.0.1:5000/student/portal";
                    }
                } else {
                    alert(`Authentication Failed: ${data.message}`);
                }
            } catch (error) {
                console.error("Login processing error:", error);
                alert("Network communication error during verification.");
            }
        });
    }

    // ==========================================
    // 2. INTERACTIVE SIGN-UP HANDLING
    // ==========================================
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = signupForm.querySelector("input[placeholder='John Doe']").value;
            const email = signupForm.querySelector("input[placeholder='johndoe@edu.ng']").value;
            const role = document.querySelector("input[name='user-role']:checked").value;
            
            const passwordInputs = signupForm.querySelectorAll("input[type='password']");
            const password = passwordInputs[0].value;
            const confirmPassword = passwordInputs[1].value;

            // Frontend validation constraint check
            if (password !== confirmPassword) {
                alert("Error: Core validation mismatch. Passwords do not match.");
                return;
            }

            // Construct payload dynamically based on active selected role type
            let payload = { name, email, role, password };

            if (role === "student") {
                payload.matricNumber = document.getElementById("matric-field").value;
                payload.level = document.getElementById("level-field").value;
            } else if (role === "lecturer") {
                payload.staffId = document.getElementById("staff-field").value;
                payload.deptToken = document.getElementById("token-field").value;
            }

            try {
                const response = await fetch("http://127.0.0.1:5000/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.success) {
                    alert("Registration validated successfully! Toggling to sign in panel.");
                    // Force a layout context switch straight back to the login tab layout view
                    document.getElementById("tab-login").click();
                    signupForm.reset();
                } else {
                    alert(`Registration Failed: ${data.message}`);
                }
            } catch (error) {
                console.error("Sign up processing error:", error);
                alert("Network error encountered during profile formulation.");
            }
        });
    }
});

// This goes into public/js/auth.js

document.addEventListener("DOMContentLoaded", () => {
    const tabLogin = document.getElementById("tab-login");
    const tabSignup = document.getElementById("tab-signup");
    const loginView = document.getElementById("login-view");
    const signupView = document.getElementById("signup-view");
    const signupForm = document.querySelector("#signup-view form");

    // Toggle between Sign In and Create Account tabs smoothly
    if (tabLogin && tabSignup) {
        tabLogin.addEventListener("click", () => {
            signupView.classList.add("hidden");
            loginView.classList.remove("hidden");
            tabLogin.className = "flex-1 text-center py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-cyan-400 bg-slate-900 border border-slate-800/50 transition-all";
            tabSignup.className = "flex-1 text-center py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-200 transition-all";
        });

        tabSignup.addEventListener("click", () => {
            loginView.classList.add("hidden");
            signupView.classList.remove("hidden");
            tabSignup.className = "flex-1 text-center py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-cyan-400 bg-slate-900 border border-slate-800/50 transition-all";
            tabLogin.className = "flex-1 text-center py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-200 transition-all";
        });
    }

    // Toggle layout fields between Student and Lecturer roles dynamically
    const roleRadios = document.querySelectorAll('input[name="user-role"]');
    const studentInputs = document.getElementById("student-inputs");
    const lecturerInputs = document.getElementById("lecturer-inputs");
    const studentLabel = document.getElementById("role-student-label");
    const lecturerLabel = document.getElementById("role-lecturer-label");

    roleRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.value === "student") {
                lecturerInputs.classList.add("hidden");
                studentInputs.classList.remove("hidden");
                studentLabel.className = "border border-cyan-500/30 bg-cyan-500/5 p-3 rounded-xl flex items-center justify-between cursor-pointer";
                lecturerLabel.className = "border border-slate-800 bg-slate-950 p-3 rounded-xl flex items-center justify-between cursor-pointer group";
            } else {
                studentInputs.classList.add("hidden");
                lecturerInputs.classList.remove("hidden");
                studentLabel.className = "border border-slate-800 bg-slate-950 p-3 rounded-xl flex items-center justify-between cursor-pointer group";
                lecturerLabel.className = "border border-indigo-500/30 bg-indigo-500/5 p-3 rounded-xl flex items-center justify-between cursor-pointer";
            }
        });
    });
});