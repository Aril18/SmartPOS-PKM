(function () {

    const STORAGE_KEY =
        "umkmControlDataV1";

    const SESSION_KEY =
        "umkmControlSessionV1";


    /* =========================================
       DATE
    ========================================= */

    function todayISO() {

        const now =
            new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    /* =========================================
       DATABASE AWAL
    ========================================= */

    function createSeedData() {

        return {

            schemaVersion: 2,


            /* ===============================
               INFORMASI USAHA
            =============================== */

            business: {

                name:
                    "Babi Guling Sari Kembar 99",

                stockUnit:
                    "Porsi"

            },


            /* ===============================
               USER
            =============================== */

            users: [

                {
                    id: 1,

                    name:
                        "Pemilik Usaha",

                    username:
                        "owner",

                    password:
                        "owner123",

                    role:
                        "OWNER",

                    status:
                        "AKTIF"
                },


                {
                    id: 2,

                    name:
                        "Made",

                    username:
                        "made",

                    password:
                        "123456",

                    role:
                        "KASIR",

                    status:
                        "AKTIF"
                },


                {
                    id: 3,

                    name:
                        "Putu",

                    username:
                        "putu",

                    password:
                        "123456",

                    role:
                        "KASIR",

                    status:
                        "AKTIF"
                },


                {
                    id: 4,

                    name:
                        "Kadek",

                    username:
                        "kadek",

                    password:
                        "123456",

                    role:
                        "KASIR",

                    status:
                        "AKTIF"
                }

            ],


            /* ===============================
               MENU
            =============================== */

            menus: [

                {
                    id: 1,
                    code: "M001",

                    name:
                        "Nasi Babi Guling Biasa",

                    category:
                        "Paket Nasi",

                    price:
                        25000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 2,
                    code: "M002",

                    name:
                        "Nasi Babi Guling Komplit",

                    category:
                        "Paket Nasi",

                    price:
                        40000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 3,
                    code: "M003",

                    name:
                        "Nasi Babi Guling Spesial",

                    category:
                        "Paket Nasi",

                    price:
                        50000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 4,
                    code: "M004",

                    name:
                        "Nasi Ayam Betutu",

                    category:
                        "Paket Nasi",

                    price:
                        20000,

                    portionUsage:
                        0,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 5,
                    code: "M005",

                    name:
                        "Daging Guling",

                    category:
                        "Daging & Lauk",

                    price:
                        30000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 6,
                    code: "M006",

                    name:
                        "Kulit",

                    category:
                        "Daging & Lauk",

                    price:
                        30000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 7,
                    code: "M007",

                    name:
                        "Urutan",

                    category:
                        "Daging & Lauk",

                    price:
                        30000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 8,
                    code: "M008",

                    name:
                        "Sate",

                    category:
                        "Daging & Lauk",

                    price:
                        50000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 9,
                    code: "M009",

                    name:
                        "Daging Merah",

                    category:
                        "Gorengan",

                    price:
                        30000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 10,
                    code: "M010",

                    name:
                        "Iga Goreng",

                    category:
                        "Gorengan",

                    price:
                        30000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 11,
                    code: "M011",

                    name:
                        "Dendeng Manis",

                    category:
                        "Gorengan",

                    price:
                        30000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 12,
                    code: "M012",

                    name:
                        "Usus Goreng",

                    category:
                        "Gorengan",

                    price:
                        30000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 13,
                    code: "M013",

                    name:
                        "Paru Goreng",

                    category:
                        "Gorengan",

                    price:
                        30000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 14,
                    code: "M014",

                    name:
                        "Ati Goreng",

                    category:
                        "Gorengan",

                    price:
                        30000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 15,
                    code: "M015",

                    name:
                        "Sup Balung",

                    category:
                        "Sayur & Pendamping",

                    price:
                        15000,

                    portionUsage:
                        1,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 16,
                    code: "M016",

                    name:
                        "Sayur Gonda",

                    category:
                        "Sayur & Pendamping",

                    price:
                        15000,

                    portionUsage:
                        0,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 17,
                    code: "M017",

                    name:
                        "Lawar",

                    category:
                        "Sayur & Pendamping",

                    price:
                        15000,

                    portionUsage:
                        0,

                    status:
                        "TERSEDIA"
                },


                {
                    id: 18,
                    code: "M018",

                    name:
                        "Sate Lilit Ayam",

                    category:
                        "Daging & Lauk",

                    price:
                        30000,

                    portionUsage:
                        0,

                    status:
                        "TERSEDIA"
                }

            ],


            /* ===============================
               PRODUKSI / STOK AWAL
            =============================== */

            production: [

                {
                    id: 1,

                    date:
                        todayISO(),

                    ingredient:
                        "Daging matang",

                    stockWeight:
                        50,

                    estimatedPortion:
                        100,

                    notes:
                        "Produksi awal hari"
                }

            ],


            /* ===============================
               DATA TRANSAKSI
            =============================== */

            transactions: [],


            /* ===============================
               WASTE
            =============================== */

            waste: [],


            /* ===============================
               STOCK OPNAME
            =============================== */

            stockOpnames: [],


            /* ===============================
               CLOSING
            =============================== */

            closings: [],


            /* ===============================
               AUDIT LOG
            =============================== */

            auditLogs: []

        };

    }


    /* =========================================
       NORMALIZE DATABASE
    ========================================= */

    function normalizeDB(data) {

        data =
            data || {};


        data.schemaVersion =
            data.schemaVersion || 2;


        data.business =
            data.business || {

                name:
                    "Babi Guling Sari Kembar 99",

                stockUnit:
                    "Porsi"

            };


        data.users =
            data.users || [];

        data.menus =
            data.menus || [];

        data.production =
            data.production || [];

        data.transactions =
            data.transactions || [];

        data.waste =
            data.waste || [];

        data.stockOpnames =
            data.stockOpnames || [];

        data.closings =
            data.closings || [];

        data.auditLogs =
            data.auditLogs || [];


        return data;

    }


    /* =========================================
       INITIALIZE DATABASE
    ========================================= */

    function initializeDatabase() {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!saved) {

            const seed =
                createSeedData();


            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(seed)
            );


            return seed;

        }


        try {

            const database =
                normalizeDB(
                    JSON.parse(saved)
                );


            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(database)
            );


            return database;

        }

        catch (error) {

            console.error(
                "Database rusak:",
                error
            );


            const seed =
                createSeedData();


            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(seed)
            );


            return seed;

        }

    }


    /* =========================================
       GET DATABASE
    ========================================= */

    function getDB() {

        return initializeDatabase();

    }


    /* =========================================
       SAVE DATABASE
    ========================================= */

    function saveDB(database) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(database)
        );

    }


    /* =========================================
       LOGIN
    ========================================= */

    function login(
        selectedRole,
        username,
        password
    ) {

        const database =
            getDB();


        const user =
            database.users.find(
                item =>

                    item.username ===
                    username

                    &&

                    item.password ===
                    password

                    &&

                    item.status ===
                    "AKTIF"
            );


        if (!user) {

            return {

                success: false,

                message:
                    "Username atau password salah."

            };

        }


        if (
            user.role !==
            selectedRole
        ) {

            return {

                success: false,

                message:

                    selectedRole ===
                    "OWNER"

                        ?
                        "Akun ini bukan akun Owner."

                        :
                        "Akun ini bukan akun Pegawai."

            };

        }


        const session = {

            id:
                user.id,

            name:
                user.name,

            username:
                user.username,

            role:
                user.role

        };


        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify(session)
        );


        database.auditLogs.push({

            id:
                Date.now(),

            userId:
                user.id,

            action:
                "LOGIN",

            description:
                `Login sebagai ${user.role}`,

            createdAt:
                new Date()
                    .toISOString()

        });


        saveDB(database);


        return {

            success: true,

            user:
                session

        };

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

        catch {

            return null;

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


        if (
            !allowedRoles.includes(
                session.role
            )
        ) {

            if (
                session.role ===
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
       SIDEBAR ROLE
    ========================================= */

    function applyRoleNavigation() {

        const session =
            getSession();


        document
            .querySelectorAll(
                ".owner-only"
            )
            .forEach(
                element => {

                    element.style.display =

                        session?.role ===
                        "OWNER"

                            ?
                            ""

                            :
                            "none";

                }
            );

    }


    /* =========================================
       RESET DATABASE UNTUK TESTING
    ========================================= */

    function resetDemoDatabase() {

        const database =
            createSeedData();


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(database)
        );


        localStorage.removeItem(
            SESSION_KEY
        );


        return database;

    }


    /* =========================================
       PUBLIC API
    ========================================= */

    window.SmartPOSDB = {

        STORAGE_KEY,

        SESSION_KEY,

        todayISO,

        getDB,

        saveDB,

        login,

        getSession,

        logout,

        requireRole,

        applyRoleNavigation,

        resetDemoDatabase

    };


    /* AUTO INIT */

    initializeDatabase();

})();