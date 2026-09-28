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


const loginForm =
    document.getElementById(
        "loginForm"
    );


const loginError =
    document.getElementById(
        "loginError"
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


                loginError.textContent =
                    "";

            }

        );

    }

);


/* =========================================
   LOGIN MELALUI MYSQL
========================================= */

loginForm.addEventListener(

    "submit",

    async function (
        event
    ) {

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


        /* =========================================
           VALIDASI FORM
        ========================================= */

        if (
            !username ||
            !password
        ) {

            loginError.textContent =
                "Username dan password wajib diisi.";


            return;

        }


        /* =========================================
           LOADING BUTTON
        ========================================= */

        const originalButtonText =
            loginButton.textContent;


        loginButton.disabled =
            true;


        loginButton.textContent =
            "Memeriksa akun...";


        loginError.textContent =
            "";


        try {

            /* =========================================
               LOGIN KE NODE.JS / MYSQL
            ========================================= */

            const result =
                await SmartPOSDB.login(

                    selectedRole,

                    username,

                    password

                );


            if (
                !result.success
            ) {

                loginError.textContent =
                    result.message;


                return;

            }


            /* =========================================
               REDIRECT BERDASARKAN ROLE MYSQL
            ========================================= */

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

        catch (error) {

            console.error(
                "Login Error:",
                error
            );


            loginError.textContent =
                "Terjadi kesalahan saat login.";

        }

        finally {

            loginButton.disabled =
                false;


            loginButton.textContent =
                originalButtonText;

        }

    }

);