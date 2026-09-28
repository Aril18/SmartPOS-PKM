

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
   DATA MYSQL
========================================= */

let menus = [];

let production = [];

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
   BASIC FUNCTIONS
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
   LOAD MENUS MYSQL
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
   LOAD TRANSACTIONS MYSQL
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
        "✅ TRANSAKSI MYSQL:",
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
                record => ({

                    ...record,

                    id:
                        Number(
                            record.id
                        ),

                    userId:
                        Number(
                            record.userId
                        ),

                    menuId:
                        record.menuId === null
                            ? null
                            : Number(
                                record.menuId
                            ),

                    quantity:
                        Number(
                            record.quantity || 0
                        ),

                    portionUsage:
                        Number(
                            record.portionUsage || 0
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
   STOCK
========================================= */

function initialStockToday() {

    return production

        .filter(

            item =>
                item.date ===
                todayISO()

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

function soldPortionsToday() {

    return transactions

        .filter(

            transaction =>

                transaction.date ===
                todayISO()

                &&

                transaction.status !==
                "VOID"

        )

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


                                const usage =
                                    Number(

                                        item
                                            .portionUsageAtSale

                                        ??

                                        menu
                                            ?.portionUsage

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
                    total
                    +
                    transactionPortions
                );

            },

            0

        );

}


/* =========================================
   WASTE HARI INI
========================================= */

function todayWaste() {

    return wasteRecords.filter(

        item =>
            item.date ===
            todayISO()

    );

}


/* =========================================
   TOTAL WASTE PORTIONS
========================================= */

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
   STOCK BEFORE WASTE
========================================= */

function stockBeforeWaste() {

    return (

        initialStockToday()

        -

        soldPortionsToday()

    );

}


/* =========================================
   EXPECTED STOCK
========================================= */

function expectedStockToday() {

    return (

        stockBeforeWaste()

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
        namaUser &&
        currentUser
    ) {

        namaUser.textContent =
            currentUser.name;

    }


    const sidebarUser =
        document.getElementById(
            "sidebarUser"
        );


    if (
        sidebarUser &&
        currentUser
    ) {

        sidebarUser.textContent =
            currentUser.name;

    }

}


/* =========================================
   MENU SELECT
========================================= */

function renderMenuOptions() {

    const select =
        document.getElementById(
            "wasteItem"
        );


    select.innerHTML = `

        <option value="">
            Pilih item
        </option>

        <option value="GENERAL_STOCK">
            Stok Daging / Porsi Umum
        </option>

    `;


    menus

        .filter(

            menu =>
                menu.status ===
                "TERSEDIA"

        )

        .forEach(

            menu => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    menu.id;


                option.textContent =
                    `${menu.name} — ${formatPortion(
                        menu.portionUsage
                    )} porsi/unit`;


                select.appendChild(
                    option
                );

            }

        );

}


/* =========================================
   SELECTED PORTION USAGE
========================================= */

function selectedPortionUsage() {

    const selected =
        document
            .getElementById(
                "wasteItem"
            )
            .value;


    if (
        selected ===
        "GENERAL_STOCK"
    ) {

        return 1;

    }


    const menu =
        getMenu(
            selected
        );


    return Number(
        menu?.portionUsage || 0
    );

}


/* =========================================
   STOCK IMPACT
========================================= */

function updateStockImpact() {

    const quantity =
        Number(
            document
                .getElementById(
                    "quantity"
                )
                .value || 0
        );


    const impact =
        quantity
        *
        selectedPortionUsage();


    document
        .getElementById(
            "stockImpact"
        )
        .textContent =
        `${formatPortion(
            impact
        )} Porsi`;

}


/* =========================================
   SUMMARY
========================================= */

function renderSummary() {

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
            "jumlahWaste"
        )
        .textContent =
        todayWaste().length;


    document
        .getElementById(
            "stokSebelumWaste"
        )
        .textContent =
        `${formatPortion(
            stockBeforeWaste()
        )} Porsi`;


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
            "stokSistem"
        )
        .textContent =
        `${formatPortion(
            expectedStockToday()
        )} Porsi`;

}


/* =========================================
   MESSAGE
========================================= */

function showMessage(
    message,
    type = "success"
) {

    const box =
        document.getElementById(
            "messageBox"
        );


    box.style.display =
        "block";


    box.textContent =
        message;


    if (
        type ===
        "success"
    ) {

        box.style.background =
            "#dcfce7";


        box.style.color =
            "#166534";


        box.style.border =
            "1px solid #bbf7d0";

    }

    else {

        box.style.background =
            "#fee2e2";


        box.style.color =
            "#991b1b";


        box.style.border =
            "1px solid #fecaca";

    }


    setTimeout(

        () => {

            box.style.display =
                "none";

        },

        4000

    );

}


/* =========================================
   SAVE WASTE MYSQL
========================================= */

async function saveWaste(
    event
) {

    event.preventDefault();


    const itemValue =
        document
            .getElementById(
                "wasteItem"
            )
            .value;


    const quantity =
        Number(
            document
                .getElementById(
                    "quantity"
                )
                .value
        );


    let reason =
        document
            .getElementById(
                "reason"
            )
            .value;


    const notes =
        document
            .getElementById(
                "notes"
            )
            .value
            .trim();


    if (
        !itemValue ||
        !quantity ||
        quantity <= 0 ||
        !reason
    ) {

        showMessage(
            "Data waste belum lengkap.",
            "error"
        );


        return;

    }


    if (
        reason ===
        "Lainnya"
    ) {

        const customReason =
            document
                .getElementById(
                    "customReason"
                )
                .value
                .trim();


        if (
            !customReason
        ) {

            showMessage(
                "Alasan lainnya wajib diisi.",
                "error"
            );


            return;

        }


        reason =
            customReason;

    }


    const portionUsage =
        selectedPortionUsage();


    const stockImpact =
        quantity
        *
        portionUsage;


    if (
        stockImpact >
        expectedStockToday()
    ) {

        showMessage(
            `Waste melebihi stok tersedia. Stok saat ini ${formatPortion(
                expectedStockToday()
            )} porsi.`,
            "error"
        );


        return;

    }


    let menuId =
        null;


    let itemName =
        "Stok Daging / Porsi Umum";


    if (
        itemValue !==
        "GENERAL_STOCK"
    ) {

        const menu =
            getMenu(
                itemValue
            );


        if (!menu) {

            showMessage(
                "Menu tidak ditemukan.",
                "error"
            );


            return;

        }


        menuId =
            Number(
                menu.id
            );


        itemName =
            menu.name;

    }


    const saveButton =
        document.querySelector(
            ".save-btn"
        );


    const originalButtonText =
        saveButton.textContent;


    try {

        saveButton.disabled =
            true;


        saveButton.textContent =
            "Menyimpan...";


        await apiRequest(
            "/api/waste",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        userId:
                            Number(
                                currentUser.id
                            ),

                        menuId:
                            menuId,

                        itemName:
                            itemName,

                        quantity:
                            quantity,

                        portionUsage:
                            portionUsage,

                        reason:
                            reason,

                        notes:
                            notes

                    })

            }
        );


        /*
         * Audit masih lokal sementara.
         */




        /*
         * Ambil ulang waste langsung
         * dari MySQL.
         */

        await loadWaste();


        showMessage(
            "Waste berhasil dicatat ke database.",
            "success"
        );


        document
            .getElementById(
                "wasteForm"
            )
            .reset();


        document
            .getElementById(
                "customReasonGroup"
            )
            .style.display =
            "none";


        updateStockImpact();

        renderSummary();

        renderWasteTable();

    }

    catch (error) {

        console.error(
            "❌ Simpan Waste Error:",
            error
        );


        showMessage(
            error.message ||
            "Gagal menyimpan waste.",
            "error"
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
   WASTE TABLE
========================================= */

function renderWasteTable() {

    const table =
        document.getElementById(
            "wasteTable"
        );


    table.innerHTML =
        "";


    const records =
        [...todayWaste()]
            .sort(

                (
                    a,
                    b
                ) =>

                    new Date(
                        b.createdAt || 0
                    )

                    -

                    new Date(
                        a.createdAt || 0
                    )

            );


    if (
        records.length ===
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
                    Belum ada waste hari ini.
                </td>

            </tr>

        `;


        return;

    }


    records.forEach(

        record => {

            let time =
                "-";


            if (
                record.createdAt
            ) {

                const date =
                    new Date(
                        record.createdAt
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


            const impact =
                Number(
                    record.quantity || 0
                )

                *

                Number(
                    record.portionUsage || 0
                );


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
                        record.userName
                        ||
                        (
                            Number(
                                record.userId
                            )
                            ===
                            Number(
                                currentUser.id
                            )
                                ? currentUser.name
                                : "-"
                        )
                    }
                </td>

                <td>
                    ${record.itemName || "-"}
                </td>

                <td>
                    ${formatPortion(
                        record.quantity
                    )}
                </td>

                <td>
                    ${formatPortion(
                        impact
                    )} Porsi
                </td>

                <td>
                    ${record.reason || "-"}
                </td>

                <td>
                    ${record.notes || "-"}
                </td>

            `;


            table.appendChild(
                row
            );

        }

    );

}


/* =========================================
   REASON
========================================= */

document
    .getElementById(
        "reason"
    )
    .addEventListener(

        "change",

        function () {

            document
                .getElementById(
                    "customReasonGroup"
                )
                .style.display =

                this.value ===
                "Lainnya"

                    ? "flex"

                    : "none";

        }

    );


/* =========================================
   STOCK IMPACT EVENTS
========================================= */

document
    .getElementById(
        "wasteItem"
    )
    .addEventListener(
        "change",
        updateStockImpact
    );


document
    .getElementById(
        "quantity"
    )
    .addEventListener(
        "input",
        updateStockImpact
    );


/* =========================================
   SUBMIT
========================================= */

document
    .getElementById(
        "wasteForm"
    )
    .addEventListener(
        "submit",
        saveWaste
    );


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

async function initializeWastePage() {

    renderUser();


    try {

        await Promise.all([

            loadMenus(),

            loadProduction(),

            loadTransactions(),

            loadWaste()

        ]);


        renderMenuOptions();

        renderSummary();

        renderWasteTable();

        updateStockImpact();

    }

    catch (error) {

        console.error(
            "❌ Initialize Waste Error:",
            error
        );


        showMessage(
            error.message ||
            "Gagal memuat data Waste.",
            "error"
        );

    }

}


initializeWastePage();