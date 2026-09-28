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

    closings: []

};


/* =========================================
   API
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
                            transaction.items || []
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

                                    price:
                                        Number(
                                            item.price || 0
                                        ),

                                    subtotal:
                                        Number(
                                            item.subtotal || 0
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
   LOAD STOCK OPNAME
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
   LOAD CLOSINGS
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


function selectedDate() {

    return document
        .getElementById(
            "reportDate"
        )
        .value;

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


    return number
        .toFixed(
            2
        )
        .replace(
            /0+$/,
            ""
        )
        .replace(
            /\.$/,
            ""
        );

}


/* =========================================
   USER & MENU
========================================= */

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


/* =========================================
   TRANSACTIONS PER DATE
========================================= */

function transactionsByDate(date) {

    return db.transactions.filter(

        transaction =>
            transaction.date ===
            date

    );

}


function validTransactions(date) {

    return transactionsByDate(
        date
    )
        .filter(

            transaction =>
                transaction.status !==
                "VOID"

        );

}


function voidTransactions(date) {

    return transactionsByDate(
        date
    )
        .filter(

            transaction =>
                transaction.status ===
                "VOID"

        );

}


/* =========================================
   SALES
========================================= */

function calculateOmzet(date) {

    return validTransactions(
        date
    )
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


function calculateCashSales(date) {

    return validTransactions(
        date
    )
        .filter(

            transaction =>
                String(
                    transaction.paymentMethod
                )
                    .toUpperCase()
                ===
                "TUNAI"

        )
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


function calculateNonCashSales(date) {

    return validTransactions(
        date
    )
        .filter(

            transaction =>
                String(
                    transaction.paymentMethod
                )
                    .toUpperCase()
                !==
                "TUNAI"

        )
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
   PRODUCTION
========================================= */

function productionPortions(date) {

    return db.production

        .filter(

            item =>
                item.date ===
                date

        )

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
   SOLD PORTIONS
========================================= */

function soldPortions(date) {

    return validTransactions(
        date
    )
        .reduce(

            (
                total,
                transaction
            ) => {

                const items =
                    transaction.items || [];


                const portions =
                    items.reduce(

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
                    portions
                );

            },

            0

        );

}


/* =========================================
   WASTE
========================================= */

function wastePortions(date) {

    return db.waste

        .filter(

            item => {

                if (
                    item.date
                ) {

                    return (
                        item.date ===
                        date
                    );

                }


                if (
                    item.createdAt
                ) {

                    return (
                        item.createdAt
                            .substring(
                                0,
                                10
                            )
                        ===
                        date
                    );

                }


                return false;

            }

        )

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
   SYSTEM STOCK
========================================= */

function systemStock(date) {

    return (

        productionPortions(
            date
        )

        -

        soldPortions(
            date
        )

        -

        wastePortions(
            date
        )

    );

}


/* =========================================
   STOCK OPNAME DIFFERENCE
========================================= */

function stockDifference(date) {

    const records =
        db.stockOpnames

            .filter(

                item =>
                    item.date ===
                    date

            )

            .sort(

                (
                    a,
                    b
                ) =>

                    Number(
                        b.id
                    )
                    -
                    Number(
                        a.id
                    )

            );


    if (
        records.length ===
        0
    ) {

        return 0;

    }


    return Number(
        records[0]
            .difference || 0
    );

}


/* =========================================
   CASH DIFFERENCE
========================================= */

function cashDifference(date) {

    const records =
        db.closings

            .filter(

                item =>
                    item.date ===
                    date

            )

            .sort(

                (
                    a,
                    b
                ) =>

                    Number(
                        b.id
                    )
                    -
                    Number(
                        a.id
                    )

            );


    if (
        records.length ===
        0
    ) {

        return 0;

    }


    return Number(
        records[0]
            .cashDifference || 0
    );

}


/* =========================================
   RENDER USER
========================================= */

function renderUser() {

    document
        .getElementById(
            "namaUser"
        )
        .textContent =
        currentUser.name;


    document
        .getElementById(
            "sidebarUser"
        )
        .textContent =
        currentUser.name;

}


/* =========================================
   SUMMARY
========================================= */

function renderSummary() {

    const date =
        selectedDate();


    document
        .getElementById(
            "totalOmzet"
        )
        .textContent =
        formatRupiah(
            calculateOmzet(
                date
            )
        );


    document
        .getElementById(
            "totalTransaksi"
        )
        .textContent =
        validTransactions(
            date
        ).length;


    document
        .getElementById(
            "penjualanTunai"
        )
        .textContent =
        formatRupiah(
            calculateCashSales(
                date
            )
        );


    document
        .getElementById(
            "penjualanNonTunai"
        )
        .textContent =
        formatRupiah(
            calculateNonCashSales(
                date
            )
        );


    document
        .getElementById(
            "totalVoid"
        )
        .textContent =
        voidTransactions(
            date
        ).length;


    document
        .getElementById(
            "porsiTerjual"
        )
        .textContent =
        `${formatPortion(
            soldPortions(
                date
            )
        )} Porsi`;


    document
        .getElementById(
            "totalWaste"
        )
        .textContent =
        `${formatPortion(
            wastePortions(
                date
            )
        )} Porsi`;


    document
        .getElementById(
            "stokSistem"
        )
        .textContent =
        `${formatPortion(
            systemStock(
                date
            )
        )} Porsi`;

}


/* =========================================
   STOCK REPORT
========================================= */

function renderStockReport() {

    const date =
        selectedDate();


    document
        .getElementById(
            "stokProduksi"
        )
        .textContent =
        `${formatPortion(
            productionPortions(
                date
            )
        )} Porsi`;


    document
        .getElementById(
            "stokTerjual"
        )
        .textContent =
        `${formatPortion(
            soldPortions(
                date
            )
        )} Porsi`;


    document
        .getElementById(
            "stokWaste"
        )
        .textContent =
        `${formatPortion(
            wastePortions(
                date
            )
        )} Porsi`;


    document
        .getElementById(
            "stokAkhir"
        )
        .textContent =
        `${formatPortion(
            systemStock(
                date
            )
        )} Porsi`;


    document
        .getElementById(
            "selisihStok"
        )
        .textContent =
        `${formatPortion(
            stockDifference(
                date
            )
        )} Porsi`;


    document
        .getElementById(
            "selisihKas"
        )
        .textContent =
        formatRupiah(
            cashDifference(
                date
            )
        );

}


/* =========================================
   TRANSACTION TABLE
========================================= */

function renderTransactionTable() {

    const table =
        document.getElementById(
            "transactionTable"
        );


    table.innerHTML =
        "";


    const date =
        selectedDate();


    const transactions =
        transactionsByDate(
            date
        );


    if (
        transactions.length ===
        0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        color:#9ca3af;
                    "
                >
                    Belum ada transaksi pada tanggal ini.
                </td>

            </tr>

        `;


        return;

    }


    const data =
        [...transactions]
            .sort(

                (
                    a,
                    b
                ) =>

                    Number(
                        b.id
                    )
                    -
                    Number(
                        a.id
                    )

            );


    data.forEach(

        transaction => {

            const user =
                getUser(
                    transaction.cashierId
                );


            let time =
                "-";


            if (
                transaction.createdAt
            ) {

                const created =
                    new Date(
                        transaction.createdAt
                    );


                if (
                    !Number.isNaN(
                        created.getTime()
                    )
                ) {

                    time =
                        created
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


            const totalItem =
                (
                    transaction.items ||
                    []
                )
                    .reduce(

                        (
                            total,
                            item
                        ) =>

                            total
                            +
                            Number(
                                item.quantity || 0
                            ),

                        0

                    );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${
                        transaction.transactionCode
                        ||
                        transaction.code
                        ||
                        "-"
                    }
                </td>

                <td>
                    ${time}
                </td>

                <td>
                    ${user?.name || "-"}
                </td>

                <td>
                    ${totalItem}
                </td>

                <td>
                    ${transaction.paymentMethod || "-"}
                </td>

                <td>
                    ${formatRupiah(
                        transaction.total
                    )}
                </td>

                <td
                    class="${
                        transaction.status ===
                        "VOID"
                            ?
                            "status-void"
                            :
                            "status-valid"
                    }"
                >
                    ${transaction.status || "-"}
                </td>

            `;


            table.appendChild(
                row
            );

        }

    );

}


/* =========================================
   REPORT TITLE
========================================= */

function renderReportTitle() {

    const date =
        selectedDate();


    if (!date) {

        return;

    }


    const formatted =
        new Date(
            `${date}T00:00:00`
        )
            .toLocaleDateString(
                "id-ID",
                {

                    day:
                        "2-digit",

                    month:
                        "long",

                    year:
                        "numeric"

                }
            );


    document
        .getElementById(
            "reportDateTitle"
        )
        .textContent =
        formatted;

}


/* =========================================
   RENDER ALL
========================================= */

function renderReport() {

    renderSummary();

    renderStockReport();

    renderTransactionTable();

    renderReportTitle();

}


/* =========================================
   PRINT
========================================= */

function printReport() {

    window.print();

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
   EVENT
========================================= */

document
    .getElementById(
        "reportDate"
    )
    .addEventListener(
        "change",
        renderReport
    );


/* =========================================
   INITIALIZE
========================================= */

async function initializeReport() {

    document
        .getElementById(
            "reportDate"
        )
        .value =
        todayISO();


    renderUser();


    try {

        await Promise.all([

            loadUsers(),

            loadMenus(),

            loadProduction(),

            loadTransactions(),

            loadWaste(),

            loadStockOpnames(),

            loadClosings()

        ]);


        console.log(
            "✅ LAPORAN MYSQL SIAP"
        );


        console.log(
            "Transactions:",
            db.transactions
        );


        console.log(
            "Production:",
            db.production
        );


        console.log(
            "Waste:",
            db.waste
        );


        renderReport();

    }

    catch (error) {

        console.error(
            "❌ Laporan Error:",
            error
        );


        alert(
            error.message ||
            "Gagal memuat laporan."
        );

    }

}


initializeReport();