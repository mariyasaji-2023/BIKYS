
        function validateForm() {
            // Get the values from the form
            
            var email = document.forms["Login_Form"]["email"].value;
            // var password = document.forms["Login_Form"]["password"].value;

            // Regular expression for email validation
            var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

            // Error message variables
            var emailError = "";
            var passwordError = "";

            // Validate email
            if (!email.match(emailPattern)) {
                emailError = "Please enter a valid email address";
            }

            // Validate password (you can add your own criteria)
            // if (password.length < 8) {
            //     passwordError = "Password must be at least 8 characters long";
            // }

            // Display error messages or submit the form
            if (emailError || passwordError) {
                document.getElementById("emailError").innerHTML = emailError;
                document.getElementById("passwordError").innerHTML = passwordError;
                return false;
            } else {
                return true;
            }
        }

