

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


/* =========================================
   CEK LOGIN
========================================= */

if (!currentUser) {

    window.location.href =
        "../index.html";

}


/* =========================================
   CEK ROLE
========================================= */

if (
    currentUser &&
    currentUser.role !==
    "OWNER"
) {

    window.location.href =
        "../pos/index.html";

}


/* =========================================
   DATA MYSQL
========================================= */

let production = [];

let menus = [];

let transactions = [];

let wasteRecords = [];

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
   TANGGAL HARI INI
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
   FORMAT PORSI
========================================= */

function formatPortion(
    value
) {

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
   LOAD PRODUCTION MYSQL
========================================= */

async function loadProduction() {

    const result =
        await apiRequest(
            "/api/production"
        );


    production =
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
        "✅ PRODUCTION MYSQL:",
        production
    );

}


/* =========================================
   LOAD MENU MYSQL
========================================= */

async function loadMenus() {

    const result =
        await apiRequest(
            "/api/menus"
        );


    menus =
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


    console.log(
        "✅ MENU MYSQL:",
        menus
    );

}


/* =========================================
   LOAD TRANSACTION MYSQL
========================================= */

async function loadTransactions() {

    const result =
        await apiRequest(
            "/api/transactions"
        );


    transactions =
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


    console.log(
        "✅ TRANSACTION MYSQL:",
        transactions
    );

}

/* =========================================
   LOAD WASTE MYSQL
========================================= */

async function loadWaste() {

    const result =
        await apiRequest(
            "/api/waste"
        );


    wasteRecords =
        (result.data || [])
            .map(
                item => ({

                    ...item,

                    id:
                        Number(
                            item.id
                        ),

                    userId:
                        Number(
                            item.userId
                        ),

                    menuId:
                        item.menuId === null
                            ? null
                            : Number(
                                item.menuId
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


    console.log(
        "✅ WASTE MYSQL:",
        wasteRecords
    );

}
/* =========================================
   GET MENU
========================================= */

function getMenu(
    menuId
) {

    return menus.find(

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
   PRODUKSI HARI INI
========================================= */

function productionToday() {

    const today =
        todayISO();


    return production.filter(

        item =>
            item.date ===
            today

    );

}


/* =========================================
   TRANSAKSI VALID HARI INI
========================================= */

function validTransactions() {

    const today =
        todayISO();


    return transactions.filter(

        transaction =>

            transaction.date ===
            today

            &&

            transaction.status !==
            "VOID"

    );

}


/* =========================================
   STOK AWAL
========================================= */

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
   PORSI TERJUAL
========================================= */

function soldPortionsToday() {

    return validTransactions()
        .reduce(

            (
                total,
                transaction
            ) => {


                const items =
                    transaction.items || [];


                const transactionPortions =
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
                    total
                    +
                    transactionPortions
                );

            },

            0

        );

}

/* =========================================
   WASTE HARI INI - MYSQL
========================================= */

function wastePortionsToday() {

    const today =
        todayISO();


    return wasteRecords

        .filter(
            item =>
                item.date ===
                today
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
   STOK SISTEM
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
   USER
========================================= */

function renderUser() {

    const namaUser =
        document.getElementById(
            "namaUser"
        );


    if (
        currentUser &&
        namaUser
    ) {

        namaUser.textContent =
            currentUser.name;

    }

}


/* =========================================
   RENDER STOK
========================================= */

function renderStock() {

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

}


/* =========================================
   STATUS STOK
========================================= */

function renderStockAlert() {

    const stock =
        expectedStockToday();


    const stockAlert =
        document.getElementById(
            "stockAlert"
        );


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
            `STOK MENIPIS: Tersisa ${formatPortion(stock)} porsi`;


        stockAlert.style.background =
            "#fef3c7";


        stockAlert.style.color =
            "#92400e";


        stockAlert.style.borderColor =
            "#fde68a";

    }

    else {

        stockAlert.textContent =
            `STOK AMAN: Tersisa ${formatPortion(stock)} porsi`;


        stockAlert.style.background =
            "#dcfce7";


        stockAlert.style.color =
            "#166534";


        stockAlert.style.borderColor =
            "#bbf7d0";

    }

}


/* =========================================
   RIWAYAT PRODUKSI
========================================= */

function renderProductionTable() {

    const productionTable =
        document.getElementById(
            "productionTable"
        );


    productionTable.innerHTML =
        "";


    if (
        production.length ===
        0
    ) {

        productionTable.innerHTML = `

            <tr>

                <td colspan="5">
                    Belum ada data produksi.
                </td>

            </tr>

        `;


        return;

    }


    production.forEach(

        item => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${item.date || "-"}
                </td>

                <td>
                    ${item.ingredient || "-"}
                </td>

                <td>
                    ${Number(
                        item.stockWeight || 0
                    )} Kg
                </td>

                <td>
                    ${formatPortion(
                        item.estimatedPortion
                    )} Porsi
                </td>

                <td>
                    ${item.notes || "-"}
                </td>

            `;


            productionTable
                .appendChild(
                    row
                );

        }

    );

}



/* =========================================
   SIMPAN PRODUKSI KE MYSQL
========================================= */

async function saveProduction(
    event
) {

    event.preventDefault();


    const productionDate =
        document
            .getElementById(
                "productionDate"
            )
            .value;


    const ingredient =
        document
            .getElementById(
                "ingredient"
            )
            .value
            .trim();


    const stockWeight =
        Number(
            document
                .getElementById(
                    "stockWeight"
                )
                .value
        );


    const estimatedPortion =
        Number(
            document
                .getElementById(
                    "estimatedPortion"
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
        !productionDate ||
        !ingredient ||
        stockWeight <= 0 ||
        estimatedPortion <= 0
    ) {

        alert(
            "Lengkapi data produksi terlebih dahulu."
        );


        return;

    }


    const saveButton =
        document.querySelector(
            ".save-button"
        );


    const originalButtonText =
        saveButton.textContent;


    try {

        saveButton.disabled =
            true;


        saveButton.textContent =
            "Menyimpan...";


        await apiRequest(
            "/api/production",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        date:
                            productionDate,

                        ingredient:
                            ingredient,

                        stockWeight:
                            stockWeight,

                        estimatedPortion:
                            estimatedPortion,

                        notes:
                            notes

                    })

            }
        );


  


        alert(
            "Data produksi berhasil disimpan ke database."
        );


        document
            .getElementById(
                "productionForm"
            )
            .reset();


        document
            .getElementById(
                "productionDate"
            )
            .value =
            todayISO();


        /*
         * Ambil ulang data terbaru
         * langsung dari MySQL.
         */

        await loadProduction();


        renderStock();

        renderProductionTable();

    }

    catch (error) {

        console.error(
            "❌ Simpan Produksi Error:",
            error
        );


        alert(
            error.message ||
            "Gagal menyimpan data produksi."
        );

    }

    finally {

        saveButton.disabled =
            false;


        saveButton.textContent =
            originalButtonText;

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
   EVENT FORM
========================================= */

const productionForm =
    document.getElementById(
        "productionForm"
    );


if (
    productionForm
) {

    productionForm.addEventListener(
        "submit",
        saveProduction
    );

}


/* =========================================
   INITIALIZE
========================================= */

async function initializeProductionPage() {

    document
        .getElementById(
            "productionDate"
        )
        .value =
        todayISO();


    renderUser();


    try {

        /*
         * SEMUA SUMBER DATA UTAMA
         * DIAMBIL DARI MYSQL.
         */

await Promise.all([

    loadProduction(),

    loadMenus(),

    loadTransactions(),

    loadWaste()

]);


        renderStock();

        renderProductionTable();

    }

    catch (error) {

        console.error(
            "❌ Initialize Production Error:",
            error
        );


        alert(
            error.message ||
            "Gagal memuat halaman Produksi."
        );

    }

}


initializeProductionPage();