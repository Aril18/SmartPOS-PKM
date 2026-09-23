(function () {

    const session =
        SmartPOSDB.getSession();


    /* =========================================
       CEK SESSION
    ========================================= */

    if (!session) {

        window.location.href =
            "../index.html";

        return;
    }


    const sidebar =
        document.getElementById(
            "appSidebar"
        );


    if (!sidebar) {
        return;
    }


    /* =========================================
       MENU OWNER
    ========================================= */

    const ownerMenus = [

        {
            name: "Dashboard",
            href: "../Dashboard/index.html",
            match: "/dashboard/"
        },

        {
            name: "Kasir / POS",
            href: "../pos/index.html",
            match: "/pos/"
        },

        {
            name: "Produksi & Stok",
            href: "../produksi/index.html",
            match: "/produksi/"
        },

        {
            name: "Menu",
            href: "../menu/index.html",
            match: "/menu/"
        },

        {
            name: "Waste",
            href: "../waste/index.html",
            match: "/waste/"
        },

        {
            name: "Stock Opname",
            href: "../stock-opname/index.html",
            match: "/stock-opname/"
        },

        {
            name: "Closing",
            href: "../closing/index.html",
            match: "/closing/"
        },

        {
            name: "Pegawai",
            href: "../pegawai/index.html",
            match: "/pegawai/"
        },

        {
            name: "Audit Aktivitas",
            href: "../audit/index.html",
            match: "/audit/"
        },

        {
            name: "Laporan",
            href: "../laporan/index.html",
            match: "/laporan/"
        }

    ];


    /* =========================================
       MENU PEGAWAI
    ========================================= */

    const employeeMenus = [

        {
            name: "Kasir / POS",
            href: "../pos/index.html",
            match: "/pos/"
        },

        {
            name: "Waste",
            href: "../waste/index.html",
            match: "/waste/"
        },

        {
            name: "Closing",
            href: "../closing/index.html",
            match: "/closing/"
        }

    ];


    /* =========================================
       PILIH MENU BERDASARKAN ROLE
    ========================================= */

    const menus =

        session.role === "OWNER"

            ? ownerMenus

            : employeeMenus;


    const currentPath =
        window.location.pathname
            .toLowerCase();


    /* =========================================
       GENERATE MENU
    ========================================= */

    const navigationHTML =
        menus.map(
            menu => {

                const active =
                    currentPath.includes(
                        menu.match
                    )

                        ? "active"

                        : "";


                return `

                    <a
                        href="${menu.href}"
                        class="${active}"
                    >
                        ${menu.name}
                    </a>

                `;

            }
        )
        .join("");


    /* =========================================
       RENDER SIDEBAR
    ========================================= */

    sidebar.innerHTML = `

        <div class="logo">

            <h2>
                SmartPOS
            </h2>

            <p>
                Sales & Stock Control
            </p>

        </div>


        <nav>

            ${navigationHTML}

        </nav>


        <div class="sidebar-user">

            <span>
                Login sebagai
            </span>

            <strong>
                ${session.name}
            </strong>

        </div>


        <button
            class="logout-btn"
            id="sharedLogoutBtn"
        >
            Logout
        </button>

    `;


    /* =========================================
       LOGOUT
    ========================================= */

    document
        .getElementById(
            "sharedLogoutBtn"
        )
        .addEventListener(
            "click",
            function () {

                SmartPOSDB.logout();

            }
        );

})();