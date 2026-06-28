document.addEventListener("DOMContentLoaded", () => {
    try {
        const userStr = localStorage.getItem("authUser");
        if (userStr) {
            const user = JSON.parse(userStr);

            // 1. Update Profile Names
            const nameElements = document.querySelectorAll(".profile-display-name");
            nameElements.forEach(el => {
                el.textContent = user.name || "Unknown User";
            });

            // 2. Update Initials/Avatars
            const avatarElements = document.querySelectorAll(".profile-initials, .h-10.w-10.bg-gradient-to-tr, .h-8.w-8.bg-gradient-to-tr");
            avatarElements.forEach(el => {
                // If it's a div meant for initials, replace its text
                if (el.tagName === 'DIV' && !el.querySelector('img')) {
                    const initials = (user.name || "U U").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    el.textContent = initials;
                }
            });

            // 3. Update Modals (like Student Portal Edit Profile Modal)
            const inputName = document.getElementById("input-student-name");
            if (inputName) {
                inputName.value = user.name || "";
            }
        }
    } catch (e) {
        console.error("Failed to load user profile data", e);
    }
});
