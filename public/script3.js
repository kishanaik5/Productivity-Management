// Define navigation functions in global scope
function showLoginPage() {
    document.getElementById("welcomeScreen").classList.add("hidden")
    document.getElementById("signupScreen").classList.add("hidden")
    document.getElementById("loginScreen").classList.remove("hidden")
  }
  
  function showSignupPage() {
    document.getElementById("welcomeScreen").classList.add("hidden")
    document.getElementById("loginScreen").classList.add("hidden")
    document.getElementById("signupScreen").classList.remove("hidden")
  }
  
  function showWelcomePage() {
    document.getElementById("loginScreen").classList.add("hidden")
    document.getElementById("signupScreen").classList.add("hidden")
    document.getElementById("welcomeScreen").classList.remove("hidden")
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    // Get form elements
    const loginForm = document.getElementById("loginForm")
    const signupForm = document.getElementById("signupForm")
    const showSignupButton = document.getElementById("showSignup")
    const closeSignupButton = document.getElementById("closeSignup")
    const signupPopup = document.getElementById("signupPopup")
  
    // Handle Login Form
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        
        const userId = document.getElementById("userId").value
        const password = document.getElementById("password").value
  
        try {
          const response = await fetch("/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, password }),
          })
  
          const data = await response.json()
  
          if (data.success) {
            // Store user data in sessionStorage
            sessionStorage.setItem("userId", userId)
            sessionStorage.setItem("userRole", data.role)
  
            // Redirect based on role
            if (data.role === "manager") {
              window.location.href = "/manager-dashboard"
            } else {
              window.location.href = "/employee-dashboard"
            }
          } else {
            alert(data.message || "Login failed")
          }
        } catch (error) {
          console.error("Login error:", error)
          alert("An error occurred during login")
        }
      })
    }
  
    // Handle Signup Form
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const password = document.getElementById("newPassword").value
        const confirmPassword = document.getElementById("confirmPassword").value
  
        if (password !== confirmPassword) {
          alert("Passwords do not match!")
          return
        }
  
        // Get selected departments
        const departmentsSelect = document.getElementById("departments")
        const selectedDepartments = Array.from(departmentsSelect.selectedOptions).map(option => option.value)
  
        const formData = {
          name: document.getElementById("name").value,
          userId: document.getElementById("newUserId").value,
          role: document.getElementById("role").value,
          designation: document.getElementById("designation").value,
          skills: document.getElementById("skills").value,
          departments: selectedDepartments, // Send as array
          email: document.getElementById("email").value,
          password: password,
        }
  
        try {
          const response = await fetch("/api/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          })
  
          const data = await response.json()
  
          if (data.success) {
            alert("Account created successfully! Please login.")
            showLoginPage()
          } else {
            alert(data.message || "Error creating account. Please try again.")
          }
        } catch (error) {
          console.error("Signup error:", error)
          alert("An error occurred during signup. Please try again.")
        }
        signupPopup.style.display = "none"
      })
    }
  
    showSignupButton.addEventListener("click", () => {
      signupPopup.style.display = "flex"
    })
  
    closeSignupButton.addEventListener("click", () => {
      signupPopup.style.display = "none"
    })
  
    // Close the popup if clicking outside of it
    signupPopup.addEventListener("click", (e) => {
      if (e.target === signupPopup) {
        signupPopup.style.display = "none"
      }
    })
  
    // Add input animation handlers
    const inputs = document.querySelectorAll("input")
    inputs.forEach((input) => {
      input.setAttribute("placeholder", " ")
    })
  })
  
  