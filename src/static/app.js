document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupContainer = document.getElementById("signup-container");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const accountControl = document.querySelector(".account-control");
  const accountMenuToggle = document.getElementById("account-menu-toggle");
  const accountMenu = document.getElementById("account-menu");
  const loginOpenButton = document.getElementById("login-open-button");
  const teacherSession = document.getElementById("teacher-session");
  const teacherName = document.getElementById("teacher-name");
  const logoutButton = document.getElementById("logout-button");
  const loginDialog = document.getElementById("login-dialog");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const loginCancelButton = document.getElementById("login-cancel-button");

  let isTeacher = false;
  let messageTimeout;

  function showMessage(text, kind) {
    messageDiv.textContent = text;
    messageDiv.className = kind;
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function closeAccountMenu() {
    accountMenu.classList.add("hidden");
    accountMenuToggle.setAttribute("aria-expanded", "false");
  }

  async function refreshAuthentication() {
    const response = await fetch("/auth/status");
    if (!response.ok) {
      throw new Error("Unable to check teacher login status.");
    }

    const session = await response.json();
    isTeacher = session.authenticated;
    signupContainer.classList.toggle("hidden", !isTeacher);
    loginOpenButton.classList.toggle("hidden", isTeacher);
    teacherSession.classList.toggle("hidden", !isTeacher);
    teacherName.textContent = isTeacher ? `Signed in: ${session.username}` : "";
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Unable to load activities.");
      }
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML =
        '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) => `<li>
                      <span class="participant-email">${email}</span>
                      ${
                        isTeacher
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}" aria-label="Remove ${email}">❌</button>`
                          : ""
                      }
                    </li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : "<p><em>No participants yet</em></p>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">${participantsHTML}</div>
        `;
        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.currentTarget;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred.", "error");
        if (response.status === 401) {
          await refreshAuthentication();
          await fetchActivities();
        }
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  accountMenuToggle.addEventListener("click", () => {
    const isOpening = accountMenu.classList.contains("hidden");
    accountMenu.classList.toggle("hidden", !isOpening);
    accountMenuToggle.setAttribute("aria-expanded", String(isOpening));
  });

  document.addEventListener("click", (event) => {
    if (!accountControl.contains(event.target)) {
      closeAccountMenu();
    }
  });

  loginOpenButton.addEventListener("click", () => {
    closeAccountMenu();
    loginError.classList.add("hidden");
    loginDialog.showModal();
  });

  loginCancelButton.addEventListener("click", () => {
    loginDialog.close();
    loginForm.reset();
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.classList.add("hidden");

    const credentials = {
      username: document.getElementById("username").value,
      password: document.getElementById("password").value,
    };

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const result = await response.json();

      if (!response.ok) {
        loginError.textContent = result.detail || "Login failed.";
        loginError.classList.remove("hidden");
        return;
      }

      loginDialog.close();
      loginForm.reset();
      await refreshAuthentication();
      await fetchActivities();
    } catch (error) {
      loginError.textContent = "Unable to log in. Please try again.";
      loginError.classList.remove("hidden");
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Unable to log out.");
      }
      await refreshAuthentication();
      await fetchActivities();
      closeAccountMenu();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = activitySelect.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred.", "error");
        if (response.status === 401) {
          await refreshAuthentication();
          await fetchActivities();
        }
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  refreshAuthentication()
    .catch((error) => {
      isTeacher = false;
      signupContainer.classList.add("hidden");
      loginOpenButton.classList.remove("hidden");
      teacherSession.classList.add("hidden");
      console.error("Error checking teacher login:", error);
    })
    .finally(fetchActivities);
});
