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

    menus: [],

    production: [],

    transactions: [],

    waste: [],

    stockOpnames: []

};


/* =========================================
   API HELPER
========================================= */

async function apiRequest(
    url,
    options = {}
) {

    const response =
        await fetch(
            `${API_URL}${url}`,
            {

                ...options,

                headers: {

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})

                }

            }
        );


    const result =
        await response.json();


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


    console.log(
        "✅ STOCK OPNAME MYSQL:",
        db.stockOpnames
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
   MENU
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


/* =========================================
   STOCK PER DATE
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


function validTransactions(date) {

    return db.transactions.filter(

        transaction =>

            transaction.date ===
            date

            &&

            transaction.status !==
            "VOID"

    );

}


function soldPortions(date) {

    return validTransactions(
        date
    )
        .reduce(

            (
                total,
                transaction
            ) => {

                const portions =
                    (
                        transaction.items || []
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


                                const usage =
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

                                        usage
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


function wastePortions(date) {

    return db.waste

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


function expectedStock(date) {

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
   STATUS
========================================= */

function getStatus(difference) {

    const absoluteDifference =
        Math.abs(
            Number(
                difference || 0
            )
        );


    if (
        absoluteDifference === 0
    ) {

        return "NORMAL";

    }


    if (
        absoluteDifference <= 2
    ) {

        return "PERLU DIPERIKSA";

    }


    return "SELISIH TINGGI";

}


/* =========================================
   CURRENT DATE FORM
========================================= */

function selectedDate() {

    return document
        .getElementById(
            "opnameDate"
        )
        .value
        ||
        todayISO();

}


/* =========================================
   SUMMARY
========================================= */

function renderStockSummary() {

    const date =
        selectedDate();


    const production =
        productionPortions(
            date
        );


    const sold =
        soldPortions(
            date
        );


    const waste =
        wastePortions(
            date
        );


    const system =
        expectedStock(
            date
        );


    document
        .getElementById(
            "stokAwal"
        )
        .textContent =
        `${formatPortion(
            production
        )} Porsi`;


    document
        .getElementById(
            "stokTerjual"
        )
        .textContent =
        `${formatPortion(
            sold
        )} Porsi`;


    document
        .getElementById(
            "stokWaste"
        )
        .textContent =
        `${formatPortion(
            waste
        )} Porsi`;


    document
        .getElementById(
            "stokSistem"
        )
        .textContent =
        `${formatPortion(
            system
        )} Porsi`;


    document
        .getElementById(
            "systemStock"
        )
        .value =
        system;

}


/* =========================================
   DIFFERENCE
========================================= */

function renderDifference() {

    const date =
        selectedDate();


    const systemStock =
        expectedStock(
            date
        );


    const physicalValue =
        document
            .getElementById(
                "physicalStock"
            )
            .value;


    const physicalStock =
        Number(
            physicalValue || 0
        );


    const difference =
        systemStock -
        physicalStock;


    document
        .getElementById(
            "stockDifference"
        )
        .value =
        `${formatPortion(
            difference
        )} Porsi`;


    const status =
        getStatus(
            difference
        );


    const statusBox =
        document.getElementById(
            "opnameStatus"
        );


    statusBox.textContent =
        status;


    statusBox.className =
        "status-box";


    if (
        physicalValue === ""
    ) {

        statusBox.textContent =
            "BELUM DIISI";


        statusBox.classList.add(
            "normal"
        );


        document
            .getElementById(
                "stockDifference"
            )
            .value =
            "0 Porsi";


        return;

    }


    if (
        status ===
        "NORMAL"
    ) {

        statusBox.classList.add(
            "normal"
        );

    }

    else if (
        status ===
        "PERLU DIPERIKSA"
    ) {

        statusBox.classList.add(
            "warning"
        );

    }

    else {

        statusBox.classList.add(
            "danger"
        );

    }

}


/* =========================================
   SAVE STOCK OPNAME MYSQL
========================================= */

async function saveStockOpname(event) {

    event.preventDefault();


    const date =
        selectedDate();


    const systemStock =
        expectedStock(
            date
        );


    const physicalStock =
        Number(
            document
                .getElementById(
                    "physicalStock"
                )
                .value
        );


    const notes =
        document
            .getElementById(
                "notes"
            )
            .value
            .trim();


    if (
        !date
    ) {

        alert(
            "Tanggal stock opname wajib diisi."
        );


        return;

    }


    if (
        Number.isNaN(
            physicalStock
        )
        ||
        physicalStock < 0
    ) {

        alert(
            "Stok fisik tidak valid."
        );


        return;

    }


    const saveButton =
        document.querySelector(
            ".save-button"
        );


    const originalText =
        saveButton
            ? saveButton.textContent
            : "";


    try {

        if (saveButton) {

            saveButton.disabled =
                true;


            saveButton.textContent =
                "Menyimpan...";

        }


        const result =
            await apiRequest(
                "/api/stock-opnames",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify({

                            date:
                                date,

                            expectedStock:
                                systemStock,

                            physicalStock:
                                physicalStock,

                            notes:
                                notes,

                            createdBy:
                                Number(
                                    currentUser.id
                                )

                        })

                }
            );


        alert(
            `Stock opname berhasil disimpan. Status: ${result.status}`
        );


        document
            .getElementById(
                "physicalStock"
            )
            .value =
            "";


        document
            .getElementById(
                "notes"
            )
            .value =
            "";


        await loadStockOpnames();


        renderDifference();

        renderStockOpnameTable();

    }

    catch (error) {

        console.error(
            "❌ Save Stock Opname Error:",
            error
        );


        alert(
            error.message ||
            "Gagal menyimpan stock opname."
        );

    }

    finally {

        if (saveButton) {

            saveButton.disabled =
                false;


            saveButton.textContent =
                originalText;

        }

    }

}


/* =========================================
   TABLE
========================================= */

function renderStockOpnameTable() {

    const table =
        document.getElementById(
            "stockOpnameTable"
        );


    table.innerHTML =
        "";


    if (
        db.stockOpnames.length ===
        0
    ) {

        table.innerHTML = `

            <tr>

                <td colspan="6">
                    Belum ada data stock opname.
                </td>

            </tr>

        `;


        return;

    }


    /*
     * API sudah mengurutkan terbaru dulu.
     */

    db.stockOpnames.forEach(

        item => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${item.date}
                </td>

                <td>
                    ${formatPortion(
                        item.expectedStock
                    )} Porsi
                </td>

                <td>
                    ${formatPortion(
                        item.physicalStock
                    )} Porsi
                </td>

                <td>
                    ${formatPortion(
                        item.difference
                    )} Porsi
                </td>

                <td>
                    ${item.status || "-"}
                </td>

                <td>
                    ${item.notes || "-"}
                </td>

            `;


            table.appendChild(
                row
            );

        }

    );

}


/* =========================================
   USER
========================================= */

function renderUser() {

    document
        .getElementById(
            "namaUser"
        )
        .textContent =
        currentUser.name;

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
   EVENTS
========================================= */

document
    .getElementById(
        "stockOpnameForm"
    )
    .addEventListener(
        "submit",
        saveStockOpname
    );


document
    .getElementById(
        "physicalStock"
    )
    .addEventListener(
        "input",
        renderDifference
    );


document
    .getElementById(
        "opnameDate"
    )
    .addEventListener(
        "change",
        () => {

            renderStockSummary();

            renderDifference();

        }
    );


/* =========================================
   INITIALIZE
========================================= */

async function initializeStockOpname() {

    document
        .getElementById(
            "opnameDate"
        )
        .value =
        todayISO();


    renderUser();


    try {

        await Promise.all([

            loadMenus(),

            loadProduction(),

            loadTransactions(),

            loadWaste(),

            loadStockOpnames()

        ]);


        renderStockSummary();

        renderDifference();

        renderStockOpnameTable();


        console.log(
            "✅ STOCK OPNAME MYSQL SIAP"
        );

    }

    catch (error) {

        console.error(
            "❌ Stock Opname Error:",
            error
        );


        alert(
            error.message ||
            "Gagal memuat Stock Opname."
        );

    }

}


initializeStockOpname();