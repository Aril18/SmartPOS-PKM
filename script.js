let selectedRole =
    "KASIR";


const roleButtons =
    document.querySelectorAll(
        ".role-option"
    );


const loginButton =
    document.querySelector(
        ".btn-primary"
    );


/* =========================================
   PILIH ROLE
========================================= */

roleButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function () {

                selectedRole =
                    this.dataset.role;


                roleButtons.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add(
                    "active"
                );


                loginButton.textContent =

                    selectedRole ===
                    "OWNER"

                        ?
                        "Login sebagai Owner"

                        :
                        "Login sebagai Pegawai";


                document
                    .getElementById(
                        "loginError"
                    )
                    .textContent =
                    "";

            }
        );

    }
);


/* =========================================
   LOGIN
========================================= */

document
    .getElementById(
        "loginForm"
    )
    .addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const username =
                document
                    .getElementById(
                        "username"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "password"
                    )
                    .value;


            const result =
                SmartPOSDB.login(

                    selectedRole,

                    username,

                    password

                );


            if (
                !result.success
            ) {

                document
                    .getElementById(
                        "loginError"
                    )
                    .textContent =
                    result.message;


                return;

            }


            if (
                result.user.role ===
                "OWNER"
            ) {

                window.location.href =
                    "Dashboard/index.html";

            }

            else {

                window.location.href =
                    "pos/index.html";

            }

        }
    );