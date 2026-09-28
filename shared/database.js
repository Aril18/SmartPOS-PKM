(function () {

    /* =========================================
       CONFIG
    ========================================= */

    const SESSION_KEY =
        "umkmControlSessionV1";


    const API_URL =
        "http://localhost:3000";


    /* =========================================
       TODAY
    ========================================= */

    function todayISO() {

        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            );


        return (
            `${year}-${month}-${day}`
        );

    }


    /* =========================================
       API HELPER
    ========================================= */

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const response =
            await fetch(
                `${API_URL}${endpoint}`,
                {

                    ...options,

                    headers: {

                        "Content-Type":
                            "application/json",

                        ...(options.headers || {})

                    }

                }
            );


        let result;


        try {

            result =
                await response.json();

        }

        catch {

            throw new Error(
                "Respons server tidak valid."
            );

        }


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Terjadi kesalahan pada server."
            );

        }


        return result;

    }


    /* =========================================
       SESSION
    ========================================= */

    function getSession() {

        try {

            return JSON.parse(

                localStorage.getItem(
                    SESSION_KEY
                )

                ||

                "null"

            );

        }

        catch (error) {

            console.error(
                "Session Error:",
                error
            );


            return null;

        }

    }


    function setSession(user) {

        const session = {

            id:
                Number(
                    user.id
                ),

            name:
                user.name,

            username:
                user.username,

            role:
                user.role,

            status:
                user.status

        };


        localStorage.setItem(

            SESSION_KEY,

            JSON.stringify(
                session
            )

        );


        return session;

    }


    /* =========================================
       LOGIN MYSQL
    ========================================= */

    async function login(
        selectedRole,
        username,
        password
    ) {

        try {

            const result =
                await apiRequest(
                    "/api/login",
                    {

                        method:
                            "POST",

                        body:
                            JSON.stringify({

                                username:
                                    username,

                                password:
                                    password

                            })

                    }
                );


            const user =
                result.user;


            if (!user) {

                return {

                    success:
                        false,

                    message:
                        "Data pengguna tidak ditemukan."

                };

            }


            if (
                String(
                    user.role
                ).toUpperCase()
                !==
                String(
                    selectedRole
                ).toUpperCase()
            ) {

                return {

                    success:
                        false,

                    message:

                        String(
                            selectedRole
                        ).toUpperCase()
                        ===
                        "OWNER"

                            ?

                            "Akun ini bukan akun Owner."

                            :

                            "Akun ini bukan akun Pegawai."

                };

            }


            const session =
                setSession(
                    user
                );


            return {

                success:
                    true,

                user:
                    session

            };

        }

        catch (error) {

            console.error(
                "Login API Error:",
                error
            );


            return {

                success:
                    false,

                message:
                    error.message ||
                    "Tidak dapat terhubung ke server SmartPOS."

            };

        }

    }


    /* =========================================
       GET USERS MYSQL
    ========================================= */

    async function getUsers() {

        try {

            const result =
                await apiRequest(
                    "/api/users"
                );


            return {

                success:
                    true,

                data:
                    result.data || []

            };

        }

        catch (error) {

            console.error(
                "Get Users Error:",
                error
            );


            return {

                success:
                    false,

                data:
                    [],

                message:
                    error.message

            };

        }

    }


    /* =========================================
       LOGOUT
    ========================================= */

    function logout() {

        localStorage.removeItem(
            SESSION_KEY
        );


        window.location.href =
            "../index.html";

    }


    /* =========================================
       ROLE GUARD
    ========================================= */

    function requireRole(
        allowedRoles
    ) {

        const session =
            getSession();


        if (!session) {

            window.location.href =
                "../index.html";


            return null;

        }


        const roles =
            Array.isArray(
                allowedRoles
            )

                ?

                allowedRoles

                :

                [
                    allowedRoles
                ];


        const normalizedRoles =
            roles.map(
                role =>
                    String(
                        role
                    ).toUpperCase()
            );


        const currentRole =
            String(
                session.role || ""
            ).toUpperCase();


        if (
            !normalizedRoles.includes(
                currentRole
            )
        ) {

            if (
                currentRole ===
                "OWNER"
            ) {

                window.location.href =
                    "../Dashboard/index.html";

            }

            else {

                window.location.href =
                    "../pos/index.html";

            }


            return null;

        }


        return session;

    }


    /* =========================================
       ROLE NAVIGATION
    ========================================= */

    function applyRoleNavigation() {

        const session =
            getSession();


        const role =
            String(
                session?.role || ""
            ).toUpperCase();


        document
            .querySelectorAll(
                ".owner-only"
            )
            .forEach(
                element => {

                    element.style.display =

                        role ===
                        "OWNER"

                            ?

                            ""

                            :

                            "none";

                }
            );

    }


    /* =========================================
       PUBLIC API
    ========================================= */

    window.SmartPOSDB = {

        SESSION_KEY,

        API_URL,

        todayISO,

        apiRequest,

        login,

        getUsers,

        getSession,

        setSession,

        logout,

        requireRole,

        applyRoleNavigation

    };


})();