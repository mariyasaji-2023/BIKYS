function validateForm() {
    // Get the values from the form
    // Update the IDs to match the IDs in your HTML form
    var username = document.forms["Signup_Form"]["username"].value;
    var email = document.forms["Signup_Form"]["email"].value;
    var password = document.forms["Signup_Form"]["password"].value;
    var confirmPassword = document.forms["Signup_Form"]["confirmpassword"].value;



    // Regular expression for email validation
    var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    // Error message variables
    var usernameError = "";
    var emailError = "";
    var passwordError = "";
    var confirmPasswordError = "";

    // Validate email
    if (!email.match(emailPattern)) {
        emailError = "Please enter a valid email address";
    }

    // Validate username
    if (username.length < 4) {
        usernameError = "Username must be at least 4 characters long";
    }



    if (password.length < 8) {
        console.log("Password is too short");
        passwordError = "Password must be at least 8 characters long";
    } else {
        console.log("Password length is fine");
        // Check for uppercase letters, lowercase letters, numbers, and special characters
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            console.log("Password criteria not met");
            passwordError = "Password must meet the specified criteria";
        }
    }



    // Validate confirm password
    if (confirmPassword !== password) {
        console.log("Passwords do not match");
        confirmPasswordError = "Passwords do not match";

        console.log("Confirm password:", confirmPassword,"]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]");

    }

  
    // Display error messages or submit the form
    if (emailError || passwordError || usernameError || confirmPasswordError ) {
        document.getElementById("emailError").innerHTML = emailError;
        document.getElementById("passwordError").innerHTML = passwordError;
        document.getElementById("usernameError").innerHTML = usernameError;
        document.getElementById("confirmPasswordError").innerHTML = confirmPasswordError;
       

        return false;
    } else {
        console.log("Form is valid. Submitting...");
        return true;
    }
}
