const SESSION_KEY =
    "umkmControlSessionV1";

const API_URL =
    "http://localhost:3000";


/* =========================================
   SESSION
========================================= */

const currentUser =
    JSON.parse(
        localStorage.getItem(
            SESSION_KEY
        ) || "null"
    );


if (!currentUser) {

    window.location.href =
        "../index.html";

}


if (
    currentUser &&
    currentUser.role !== "OWNER"
) {

    window.location.href =
        "../pos/index.html";

}


/* =========================================
   DATA MYSQL
========================================= */

const db = {

    users: [],

    menus: [],

    production: [],

    transactions: [],

    waste: [],

    stockOpnames: [],

    closings: [],

    auditLogs: []

};


/* =========================================
   API HELPER
========================================= */

async function apiRequest(url) {

    const response =
        await fetch(
            `${API_URL}${url}`
        );


    const result =
        await response.json();


    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(
            result.message ||
            "Gagal mengambil data."
        );

    }


    return result;

}


/* =========================================
   LOAD USERS
========================================= */

async function loadUsers() {

    const result =
        await apiRequest(
            "/api/users"
        );


    db.users =
        (result.data || [])
            .map(
                user => ({

                    ...user,

                    id:
                        Number(
                            user.id
                        )

                })
            );

}


/* =========================================
   LOAD MENUS
========================================= */

async function loadMenus() {

    const result =
        await apiRequest(
            "/api/menus"
        );


    db.menus =
        (result.data || [])
            .map(
                menu => ({

                    ...menu,

                    id:
                        Number(
                            menu.id
                        ),

                    price:
                        Number(
                            menu.price || 0
                        ),

                    portionUsage:
                        Number(
                            menu.portionUsage || 0
                        )

                })
            );

}


/* =========================================
   LOAD PRODUCTION
========================================= */

async function loadProduction() {

    const result =
        await apiRequest(
            "/api/production"
        );


    db.production =
        (result.data || [])
            .map(
                item => ({

                    ...item,

                    id:
                        Number(
                            item.id
                        ),

                    stockWeight:
                        Number(
                            item.stockWeight || 0
                        ),

                    estimatedPortion:
                        Number(
                            item.estimatedPortion || 0
                        )

                })
            );


    console.log(
        "✅ DASHBOARD PRODUCTION:",
        db.production
    );

}


/* =========================================
   LOAD TRANSACTIONS
========================================= */

async function loadTransactions() {

    const result =
        await apiRequest(
            "/api/transactions"
        );


    db.transactions =
        (result.data || [])
            .map(
                transaction => ({

                    ...transaction,

                    id:
                        Number(
                            transaction.id
                        ),

                    cashierId:
                        Number(
                            transaction.cashierId
                        ),

                    total:
                        Number(
                            transaction.total || 0
                        ),

                    items:
                        (
                            transaction.items ||
                            []
                        )
                            .map(
                                item => ({

                                    ...item,

                                    menuId:
                                        Number(
                                            item.menuId
                                        ),

                                    quantity:
                                        Number(
                                            item.quantity || 0
                                        ),

                                    portionUsageAtSale:
                                        Number(
                                            item.portionUsageAtSale || 0
                                        )

                                })
                            )

                })
            );

}


/* =========================================
   LOAD WASTE
========================================= */

async function loadWaste() {

    const result =
        await apiRequest(
            "/api/waste"
        );


    db.waste =
        (result.data || [])
            .map(
                item => ({

                    ...item,

                    id:
                        Number(
                            item.id
                        ),

                    quantity:
                        Number(
                            item.quantity || 0
                        ),

                    portionUsage:
                        Number(
                            item.portionUsage || 0
                        )

                })
            );

}


/* =========================================
   LOAD STOCK OPNAMES
========================================= */

async function loadStockOpnames() {

    const result =
        await apiRequest(
            "/api/stock-opnames"
        );


    db.stockOpnames =
        (result.data || [])
            .map(
                item => ({

                    ...item,

                    id:
                        Number(
                            item.id
                        ),

                    expectedStock:
                        Number(
                            item.expectedStock || 0
                        ),

                    physicalStock:
                        Number(
                            item.physicalStock || 0
                        ),

                    difference:
                        Number(
                            item.difference || 0
                        )

                })
            );

}


/* =========================================
   LOAD CLOSINGS MYSQL
========================================= */

async function loadClosings() {

    const result =
        await apiRequest(
            "/api/closings"
        );


    db.closings =
        (result.data || [])
            .map(
                closing => ({

                    ...closing,

                    id:
                        Number(
                            closing.id
                        ),

                    cashierId:
                        Number(
                            closing.cashierId
                        ),

                    transactionCount:
                        Number(
                            closing.transactionCount || 0
                        ),

                    voidCount:
                        Number(
                            closing.voidCount || 0
                        ),

                    cashSales:
                        Number(
                            closing.cashSales || 0
                        ),

                    nonCashSales:
                        Number(
                            closing.nonCashSales || 0
                        ),

                    systemCash:
                        Number(
                            closing.systemCash || 0
                        ),

                    actualCash:
                        Number(
                            closing.actualCash || 0
                        ),

                    cashDifference:
                        Number(
                            closing.cashDifference || 0
                        )

                })
            );


    console.log(
        "✅ DASHBOARD CLOSINGS MYSQL:",
        db.closings
    );

}


/* =========================================
   LOAD AUDIT MYSQL
========================================= */

async function loadAuditLogs() {

    const result =
        await apiRequest(
            "/api/audit-logs"
        );


    db.auditLogs =
        (result.data || [])
            .map(
                log => ({

                    ...log,

                    id:
                        Number(
                            log.id
                        ),

                    userId:
                        Number(
                            log.userId
                        )

                })
            );


    console.log(
        "✅ DASHBOARD AUDIT MYSQL:",
        db.auditLogs
    );

}


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


    return `${year}-${month}-${day}`;

}


/* =========================================
   FORMAT
========================================= */

function formatRupiah(value) {

    return new Intl.NumberFormat(
        "id-ID",
        {

            style:
                "currency",

            currency:
                "IDR",

            minimumFractionDigits:
                0

        }
    ).format(
        Number(
            value || 0
        )
    );

}


function formatPortion(value) {

    const number =
        Number(
            value || 0
        );


    if (
        Number.isInteger(
            number
        )
    ) {

        return number;

    }


    return number.toFixed(
        1
    );

}


/* =========================================
   HELPERS
========================================= */

function getMenu(menuId) {

    return db.menus.find(

        menu =>
            Number(
                menu.id
            )
            ===
            Number(
                menuId
            )

    );

}


function getUser(userId) {

    return db.users.find(

        user =>
            Number(
                user.id
            )
            ===
            Number(
                userId
            )

    );

}


/* =========================================
   PRODUCTION TODAY
========================================= */

function productionToday() {

    const today =
        todayISO();


    return db.production.filter(

        item =>
            item.date ===
            today

    );

}


function initialPortionsToday() {

    return productionToday()
        .reduce(

            (
                total,
                item
            ) =>

                total
                +
                Number(
                    item.estimatedPortion || 0
                ),

            0

        );

}


/* =========================================
   TRANSACTIONS TODAY
========================================= */

function transactionsToday() {

    const today =
        todayISO();


    return db.transactions.filter(

        transaction =>
            transaction.date ===
            today

    );

}


function validTransactions() {

    return transactionsToday()
        .filter(

            transaction =>
                transaction.status !==
                "VOID"

        );

}


function voidTransactions() {

    return transactionsToday()
        .filter(

            transaction =>
                transaction.status ===
                "VOID"

        );

}


/* =========================================
   SOLD PORTIONS
========================================= */

function soldPortionsToday() {

    return validTransactions()
        .reduce(

            (
                total,
                transaction
            ) => {

                const transactionPortions =
                    (
                        transaction.items ||
                        []
                    )
                        .reduce(

                            (
                                subtotal,
                                item
                            ) => {

                                const menu =
                                    getMenu(
                                        item.menuId
                                    );


                                const portionUsage =
                                    Number(

                                        item.portionUsageAtSale

                                        ??

                                        menu?.portionUsage

                                        ??

                                        0

                                    );


                                return (

                                    subtotal

                                    +

                                    (
                                        Number(
                                            item.quantity || 0
                                        )

                                        *

                                        portionUsage
                                    )

                                );

                            },

                            0

                        );


                return (
                    total +
                    transactionPortions
                );

            },

            0

        );

}


/* =========================================
   WASTE TODAY
========================================= */

function todayWaste() {

    const today =
        todayISO();


    return db.waste.filter(

        item =>
            item.date ===
            today

    );

}


function wastePortionsToday() {

    return todayWaste()
        .reduce(

            (
                total,
                item
            ) =>

                total

                +

                (
                    Number(
                        item.quantity || 0
                    )

                    *

                    Number(
                        item.portionUsage || 0
                    )
                ),

            0

        );

}


/* =========================================
   STOCK
========================================= */

function expectedStockToday() {

    return (

        initialPortionsToday()

        -

        soldPortionsToday()

        -

        wastePortionsToday()

    );

}


/* =========================================
   OMZET
========================================= */

function omzetToday() {

    return validTransactions()
        .reduce(

            (
                total,
                transaction
            ) =>

                total
                +
                Number(
                    transaction.total || 0
                ),

            0

        );

}


/* =========================================
   STOCK DIFFERENCE
========================================= */

function stockDifferenceToday() {

    const today =
        todayISO();


    const stockOpname =
        db.stockOpnames.find(

            item =>
                item.date ===
                today

        );


    if (!stockOpname) {

        return 0;

    }


    return Number(
        stockOpname.difference || 0
    );

}


/* =========================================
   CASH DIFFERENCE
========================================= */

function cashDifferenceToday() {

    const today =
        todayISO();


    /*
     * API Closing sudah urut terbaru dulu.
     */

    const closing =
        db.closings.find(

            item =>
                item.date ===
                today

        );


    if (!closing) {

        return 0;

    }


    return Number(
        closing.cashDifference || 0
    );

}


/* =========================================
   RENDER DASHBOARD
========================================= */

function renderDashboard() {

    document
        .getElementById(
            "namaUser"
        )
        .textContent =
        currentUser.name;


    document
        .getElementById(
            "omzetHariIni"
        )
        .textContent =
        formatRupiah(
            omzetToday()
        );


    document
        .getElementById(
            "jumlahTransaksi"
        )
        .textContent =
        validTransactions()
            .length;


    document
        .getElementById(
            "porsiTerjual"
        )
        .textContent =
        formatPortion(
            soldPortionsToday()
        );


    document
        .getElementById(
            "stokTersisa"
        )
        .textContent =
        `${formatPortion(
            expectedStockToday()
        )} Porsi`;


    document
        .getElementById(
            "wasteHariIni"
        )
        .textContent =
        `${formatPortion(
            wastePortionsToday()
        )} Porsi`;


    document
        .getElementById(
            "jumlahVoid"
        )
        .textContent =
        voidTransactions()
            .length;


    document
        .getElementById(
            "selisihStok"
        )
        .textContent =
        `${formatPortion(
            stockDifferenceToday()
        )} Porsi`;


    document
        .getElementById(
            "selisihKas"
        )
        .textContent =
        formatRupiah(
            cashDifferenceToday()
        );


    document
        .getElementById(
            "stokAwal"
        )
        .textContent =
        `${formatPortion(
            initialPortionsToday()
        )} Porsi`;


    document
        .getElementById(
            "stokTerjual"
        )
        .textContent =
        `${formatPortion(
            soldPortionsToday()
        )} Porsi`;


    document
        .getElementById(
            "stokWaste"
        )
        .textContent =
        `${formatPortion(
            wastePortionsToday()
        )} Porsi`;


    document
        .getElementById(
            "stokSistem"
        )
        .textContent =
        `${formatPortion(
            expectedStockToday()
        )} Porsi`;


    renderStockAlert();

    renderAuditTable();

}


/* =========================================
   STOCK ALERT
========================================= */

function renderStockAlert() {

    const stock =
        expectedStockToday();


    const stockAlert =
        document.getElementById(
            "stockAlert"
        );


    if (
        !stockAlert
    ) {

        return;

    }


    if (
        stock <= 0
    ) {

        stockAlert.textContent =
            "STOK HABIS";


        stockAlert.style.background =
            "#fee2e2";


        stockAlert.style.color =
            "#991b1b";


        stockAlert.style.borderColor =
            "#fecaca";

    }

    else if (
        stock <= 10
    ) {

        stockAlert.textContent =
            `STOK MENIPIS: Tersisa ${formatPortion(
                stock
            )} porsi`;


        stockAlert.style.background =
            "#fef3c7";


        stockAlert.style.color =
            "#92400e";


        stockAlert.style.borderColor =
            "#fde68a";

    }

    else {

        stockAlert.textContent =
            `STOK AMAN: Tersisa ${formatPortion(
                stock
            )} porsi`;


        stockAlert.style.background =
            "#dcfce7";


        stockAlert.style.color =
            "#166534";


        stockAlert.style.borderColor =
            "#bbf7d0";

    }

}


/* =========================================
   AKTIVITAS TERBARU MYSQL
========================================= */

function renderAuditTable() {

    const auditTable =
        document.getElementById(
            "auditTable"
        );


    if (!auditTable) {

        return;

    }


    auditTable.innerHTML =
        "";


    /*
     * API sudah mengirim aktivitas
     * paling baru di posisi atas.
     *
     * Jadi TIDAK perlu .reverse()
     */

    const logs =
        [...db.auditLogs]
            .slice(
                0,
                10
            );


    if (
        logs.length ===
        0
    ) {

        auditTable.innerHTML = `

            <tr>

                <td colspan="4">
                    Belum ada aktivitas.
                </td>

            </tr>

        `;


        return;

    }


    logs.forEach(

        log => {

            const user =
                getUser(
                    log.userId
                );


            let time =
                "-";


            if (
                log.createdAt
            ) {

                const date =
                    new Date(
                        log.createdAt
                    );


                if (
                    !Number.isNaN(
                        date.getTime()
                    )
                ) {

                    time =
                        date
                            .toLocaleTimeString(
                                "id-ID",
                                {

                                    hour:
                                        "2-digit",

                                    minute:
                                        "2-digit"

                                }
                            );

                }

            }


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${time}
                </td>

                <td>
                    ${
                        log.userName
                        ||
                        user?.name
                        ||
                        "-"
                    }
                </td>

                <td>
                    ${log.action || "-"}
                </td>

                <td>
                    ${log.description || "-"}
                </td>

            `;


            auditTable.appendChild(
                row
            );

        }

    );

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
   INITIALIZE
========================================= */

async function initializeDashboard() {

    try {

        await Promise.all([

            loadUsers(),

            loadMenus(),

            loadProduction(),

            loadTransactions(),

            loadWaste(),

            loadStockOpnames(),

            loadClosings(),

            loadAuditLogs()

        ]);


        console.log(
            "✅ DASHBOARD MYSQL SIAP"
        );


        renderDashboard();

    }

    catch (error) {

        console.error(
            "❌ Dashboard Error:",
            error
        );


        alert(
            error.message ||
            "Gagal memuat Dashboard."
        );

    }

}


initializeDashboard();