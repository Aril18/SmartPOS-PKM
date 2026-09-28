const SESSION_KEY = "umkmControlSessionV1";
const API_URL = "http://localhost:3000";

const currentUser = JSON.parse(
    localStorage.getItem(SESSION_KEY) || "null"
);

if (!currentUser) {
    window.location.href = "../index.html";
}

const db = {
    users: [],
    menus: [],
    transactions: [],
    production: [],
    waste: [],
    iotValidations: []
};

let cart = [];
let activeCategory = "Semua";
let currentSearch = "";
let iotQueueTimer = null;


/* =========================================
   API HELPER
========================================= */

async function apiRequest(path, options = {}) {

    const response = await fetch(
        `${API_URL}${path}`,
        {
            ...options,

            headers: {

                "Content-Type":
                    "application/json",

                ...(options.headers || {})

            }

        }
    );


    let result = null;


    try {

        result =
            await response.json();

    }

    catch (error) {

        result = null;

    }


    if (
        !response.ok ||
        !result?.success
    ) {

        throw new Error(

            result?.message ||

            `Request gagal (${response.status}).`

        );

    }


    return result;

}


/* =========================================
   FORMAT & UTILITIES
========================================= */

function todayISO() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        )
        .padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}


function compactToday() {

    return (
        todayISO()
            .replaceAll(
                "-",
                ""
            )
    );

}


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

    )
    .format(
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

        return String(
            number
        );

    }


    return number
        .toFixed(
            1
        );

}


function normalizeOrderType(value) {

    const normalized =
        String(
            value ||
            "TAKEAWAY"
        )
        .trim()
        .toUpperCase()
        .replaceAll(
            " ",
            "_"
        );


    return (
        normalized ===
        "DINE_IN"

            ?

        "DINE_IN"

            :

        "TAKEAWAY"
    );

}


function getSelectedOrderType() {

    const selected =
        document
            .querySelector(
                'input[name="orderType"]:checked'
            );


    return normalizeOrderType(

        selected?.value ||

        "TAKEAWAY"

    );

}


function orderTypeLabel(
    orderType
) {

    return (
        normalizeOrderType(
            orderType
        )
        ===
        "DINE_IN"

            ?

        "Dine In"

            :

        "Take Away"
    );

}


function validationUnit(
    orderType
) {

    return (
        normalizeOrderType(
            orderType
        )
        ===
        "DINE_IN"

            ?

        "sajian"

            :

        "kemasan"
    );

}


function stationLabel(
    orderType
) {

    return (
        normalizeOrderType(
            orderType
        )
        ===
        "DINE_IN"

            ?

        "Meja Dine In"

            :

        "Meja Take Away"
    );

}


function getUser(
    userId
) {

    return (

        db.users.find(

            user =>
                Number(
                    user.id
                )
                ===
                Number(
                    userId
                )

        )

        ||

        null

    );

}


function getTransaction(
    transactionId
) {

    return (

        db.transactions.find(

            transaction =>

                Number(
                    transaction.id
                )
                ===
                Number(
                    transactionId
                )

        )

        ||

        null

    );

}


function safeDateTime(value) {

    if (!value) {

        return null;

    }


    const parsed =
        new Date(
            value
        );


    return (

        Number.isNaN(
            parsed.getTime()
        )

            ?

        null

            :

        parsed

    );

}


function formatTime(value) {

    const date =
        safeDateTime(
            value
        );


    if (!date) {

        return "-";

    }


    return date
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


/* =========================================
   MESSAGE
========================================= */

function showMessage(
    message,
    type = "success"
) {

    const box =
        document
            .getElementById(
                "messageBox"
            );


    if (!box) {

        return;

    }


    box.className =
        `message-box ${type}`;


    box.textContent =
        message;


    box.style.display =
        "block";


    window.clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        window.setTimeout(

            () => {

                box.style.display =
                    "none";

            },

            5000

        );

}


/* =========================================
   LOAD MENU MYSQL
========================================= */

async function loadMenusFromAPI() {

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

                        menu.portionUsage

                        ??

                        menu.portion_usage

                        ??

                        0

                    )

            })

        );


    renderMenu();

}


/* =========================================
   LOAD USERS MYSQL
========================================= */

async function loadUsersFromAPI() {

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
   LOAD TRANSAKSI MYSQL
========================================= */

async function loadTransactionsFromAPI() {

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


                transactionCode:

                    transaction.transactionCode

                    ??

                    transaction.transaction_code

                    ??

                    "-",


                cashierId:
                    Number(

                        transaction.cashierId

                        ??

                        transaction.cashier_id

                        ??

                        0

                    ),


                date:

                    transaction.date

                    ??

                    transaction.transaction_date

                    ??

                    "",


                createdAt:

                    transaction.createdAt

                    ??

                    transaction.created_at

                    ??

                    null,


                paymentMethod:

                    transaction.paymentMethod

                    ??

                    transaction.payment_method

                    ??

                    "-",


                orderType:
                    normalizeOrderType(

                        transaction.orderType

                        ??

                        transaction.order_type

                        ??

                        "TAKEAWAY"

                    ),


                total:
                    Number(
                        transaction.total || 0
                    ),


                status:
                    String(

                        transaction.status

                        ||

                        "SUCCESS"

                    )
                    .toUpperCase(),


                voidReason:

                    transaction.voidReason

                    ??

                    transaction.void_reason

                    ??

                    null,


                voidedAt:

                    transaction.voidedAt

                    ??

                    transaction.voided_at

                    ??

                    null,


                items:
                    (
                        transaction.items || []
                    )
                    .map(

                        item => ({

                            ...item,


                            id:

                                item.id ===
                                undefined

                                ||

                                item.id ===
                                null

                                    ?

                                undefined

                                    :

                                Number(
                                    item.id
                                ),


                            menuId:
                                Number(

                                    item.menuId

                                    ??

                                    item.menu_id

                                    ??

                                    0

                                ),


                            nameAtSale:

                                item.nameAtSale

                                ??

                                item.menu_name

                                ??

                                item.name

                                ??

                                "Item",


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

                                    item.portionUsageAtSale

                                    ??

                                    item.portion_usage

                                    ??

                                    item.portionUsage

                                    ??

                                    0

                                )

                        })

                    )

            })

        );

}


/* =========================================
   LOAD PRODUCTION MYSQL
========================================= */

async function loadProductionFromAPI() {

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


                date:

                    item.date

                    ??

                    item.productionDate

                    ??

                    item.production_date

                    ??

                    "",


                estimatedPortion:
                    Number(

                        item.estimatedPortion

                        ??

                        item.estimated_portion

                        ??

                        0

                    )

            })

        );

}


/* =========================================
   LOAD WASTE MYSQL
========================================= */

async function loadWasteFromAPI() {

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


                date:

                    item.date

                    ??

                    item.wasteDate

                    ??

                    item.waste_date

                    ??

                    "",


                quantity:
                    Number(
                        item.quantity || 0
                    ),


                portionUsage:
                    Number(

                        item.portionUsage

                        ??

                        item.portion_usage

                        ??

                        0

                    ),


                totalPortion:
                    Number(

                        item.totalPortion

                        ??

                        item.total_portion

                        ??

                        0

                    )

            })

        );

}


/* =========================================
   LOAD IOT VALIDATIONS
========================================= */

async function loadIotValidationsFromAPI() {

    try {

        const result =
            await apiRequest(
                "/api/iot-validations"
            );


        db.iotValidations =
            (result.data || [])
            .map(

                item => {


                    const transaction =
                        getTransaction(

                            item.transactionId

                            ??

                            item.transaction_id

                        );


                    return {

                        ...item,


                        id:
                            Number(
                                item.id
                            ),


                        transactionId:
                            Number(

                                item.transactionId

                                ??

                                item.transaction_id

                                ??

                                0

                            ),


                        transactionCode:

                            item.transactionCode

                            ??

                            item.transaction_code

                            ??

                            transaction
                                ?.transactionCode

                            ??

                            "-",


                        validationStation:
                            normalizeOrderType(

                                item.validationStation

                                ??

                                item.validation_station

                                ??

                                transaction
                                    ?.orderType

                                ??

                                "TAKEAWAY"

                            ),


                        expectedCount:
                            Number(

                                item.expectedCount

                                ??

                                item.expected_count

                                ??

                                0

                            ),


                        detectedCount:

                            item.detectedCount ===
                            null

                            ||

                            item.detected_count ===
                            null

                            ||

                            (

                                item.detectedCount ===
                                undefined

                                &&

                                item.detected_count ===
                                undefined

                            )

                                ?

                            null

                                :

                            Number(

                                item.detectedCount

                                ??

                                item.detected_count

                            ),


                        averageConfidence:

                            item.averageConfidence ===
                            null

                            ||

                            item.average_confidence ===
                            null

                            ||

                            (

                                item.averageConfidence ===
                                undefined

                                &&

                                item.average_confidence ===
                                undefined

                            )

                                ?

                            null

                                :

                            Number(

                                item.averageConfidence

                                ??

                                item.average_confidence

                            ),


                        status:
                            String(

                                item.status

                                ||

                                "PENDING"

                            )
                            .toUpperCase(),


                        createdAt:

                            item.createdAt

                            ??

                            item.created_at

                            ??

                            null,


                        validatedAt:

                            item.validatedAt

                            ??

                            item.validated_at

                            ??

                            null

                    };

                }

            );


        renderIotQueue();

    }

    catch (error) {

        console.error(

            "Gagal mengambil validasi IoT:",

            error

        );

    }

}


/* =========================================
   STOCK
========================================= */

function productionPortionsToday() {

    return db.production

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
                    item.estimatedPortion
                    ||
                    0
                ),

            0

        );

}


function soldPortionsToday() {

    return db.transactions

        .filter(

            transaction =>

                transaction.date ===
                todayISO()

                &&

                transaction.status ===
                "SUCCESS"

        )

        .reduce(

            (
                total,
                transaction
            ) => {


                const used =
                    (
                        transaction.items
                        ||
                        []
                    )
                    .reduce(

                        (
                            sum,
                            item
                        ) =>

                            sum
                            +
                            (

                                Number(
                                    item.quantity
                                    ||
                                    0
                                )

                                *

                                Number(
                                    item.portionUsageAtSale
                                    ||
                                    0
                                )

                            ),

                        0

                    );


                return (
                    total
                    +
                    used
                );

            },

            0

        );

}


function wastePortionsToday() {

    return db.waste

        .filter(

            item =>
                item.date ===
                todayISO()

        )

        .reduce(

            (
                total,
                item
            ) => {


                const explicit =
                    Number(
                        item.totalPortion
                        ||
                        0
                    );


                if (
                    explicit > 0
                ) {

                    return (
                        total
                        +
                        explicit
                    );

                }


                return (

                    total

                    +

                    (

                        Number(
                            item.quantity
                            ||
                            0
                        )

                        *

                        Number(
                            item.portionUsage
                            ||
                            0
                        )

                    )

                );

            },

            0

        );

}


function expectedStockToday() {

    return Math.max(

        0,

        productionPortionsToday()

        -

        soldPortionsToday()

        -

        wastePortionsToday()

    );

}


function renderStock() {

    const element =
        document
            .getElementById(
                "stokSistem"
            );


    if (!element) {

        return;

    }


    element.textContent =

        `${formatPortion(
            expectedStockToday()
        )} Porsi`;

}


/* =========================================
   USER
========================================= */

function renderUser() {

    const namaKasir =
        document
            .getElementById(
                "namaKasir"
            );


    if (
        namaKasir
    ) {

        namaKasir.textContent =

            currentUser?.name

            ||

            currentUser?.username

            ||

            "-";

    }

}


/* =========================================
   MENU
========================================= */
function availableMenus() {

    return db.menus.filter(

        menu => {

            const status =
                String(
                    menu.status ||
                    "TERSEDIA"
                )
                .trim()
                .toUpperCase();


            return (
                status === "TERSEDIA"
                ||
                status === "AKTIF"
            );

        }

    );

}
function renderMenu() {

    const menuList =
        document
            .getElementById(
                "menuList"
            );


    if (!menuList) {

        return;

    }


    const keyword =
        currentSearch
            .toLowerCase();


    const filteredMenus =
        availableMenus()
        .filter(

            menu => {


                const matchesSearch =

                    String(
                        menu.name || ""
                    )
                    .toLowerCase()
                    .includes(
                        keyword
                    )

                    ||

                    String(
                        menu.category || ""
                    )
                    .toLowerCase()
                    .includes(
                        keyword
                    );


                const matchesCategory =

                    activeCategory ===
                    "Semua"

                    ||

                    menu.category ===
                    activeCategory;


                return (

                    matchesSearch

                    &&

                    matchesCategory

                );

            }

        );


    menuList.innerHTML =
        "";


    if (
        filteredMenus.length ===
        0
    ) {

        menuList.innerHTML = `

            <div
                style="
                    grid-column: 1 / -1;
                    text-align: center;
                    color: #9ca3af;
                    padding: 40px;
                    font-size: 13px;
                "
            >
                Menu tidak ditemukan.
            </div>

        `;


        return;

    }


    filteredMenus.forEach(

        menu => {


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "menu-card";


            card.innerHTML = `

                <div class="menu-category">
                    ${menu.category || "-"}
                </div>


                <div class="menu-name">
                    ${menu.name || "-"}
                </div>


                <div class="menu-price">

                    ${formatRupiah(
                        menu.price
                    )}

                </div>


                <div class="menu-portion">

                    Penggunaan stok:
                    ${formatPortion(
                        menu.portionUsage
                    )}
                    porsi

                </div>

            `;


            card.addEventListener(

                "click",

                () =>
                    addToCart(
                        menu.id
                    )

            );


            menuList.appendChild(
                card
            );

        }

    );

}


function setupCategoryFilter() {

    document
        .querySelectorAll(
            ".category-btn"
        )
        .forEach(

            button => {


                button.addEventListener(

                    "click",

                    function () {


                        activeCategory =

                            this.dataset.category

                            ||

                            "Semua";


                        document
                            .querySelectorAll(
                                ".category-btn"
                            )
                            .forEach(

                                item =>
                                    item
                                        .classList
                                        .remove(
                                            "active"
                                        )

                            );


                        this.classList.add(
                            "active"
                        );


                        renderMenu();

                    }

                );

            }

        );

}


/* =========================================
   CART
========================================= */

function addToCart(
    menuId
) {

    const menu =
        db.menus.find(

            item =>
                Number(
                    item.id
                )
                ===
                Number(
                    menuId
                )

        );


    if (!menu) {

        return;

    }


    const existing =
        cart.find(

            item =>
                Number(
                    item.menuId
                )
                ===
                Number(
                    menuId
                )

        );


    if (
        existing
    ) {

        existing.quantity +=
            1;

    }

    else {

        cart.push({

            menuId:
                Number(
                    menu.id
                ),

            name:
                menu.name,

            price:
                Number(
                    menu.price || 0
                ),

            portionUsage:
                Number(
                    menu.portionUsage
                    ||
                    0
                ),

            quantity:
                1

        });

    }


    renderCart();

}


function changeQuantity(
    menuId,
    amount
) {

    const item =
        cart.find(

            cartItem =>

                Number(
                    cartItem.menuId
                )
                ===
                Number(
                    menuId
                )

        );


    if (!item) {

        return;

    }


    item.quantity +=
        Number(
            amount
        );


    if (
        item.quantity <= 0
    ) {

        cart =
            cart.filter(

                cartItem =>

                    Number(
                        cartItem.menuId
                    )
                    !==
                    Number(
                        menuId
                    )

            );

    }


    renderCart();

}


function clearCart() {

    if (
        cart.length === 0
    ) {

        return;

    }


    if (
        !confirm(
            "Kosongkan semua pesanan?"
        )
    ) {

        return;

    }


    cart = [];


    renderCart();

}


function cartTotal() {

    return cart.reduce(

        (
            total,
            item
        ) =>

            total
            +
            (

                Number(
                    item.price || 0
                )

                *

                Number(
                    item.quantity || 0
                )

            ),

        0

    );

}


function cartItemCount() {

    return cart.reduce(

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

}


function cartPortionUsage() {

    return cart.reduce(

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


function renderCart() {

    const cartList =
        document
            .getElementById(
                "cartList"
            );


    if (!cartList) {

        return;

    }


    cartList.innerHTML =
        "";


    if (
        cart.length === 0
    ) {

        cartList.innerHTML = `

            <div class="empty-cart">
                Belum ada menu dipilih.
            </div>

        `;

    }

    else {

        cart.forEach(

            item => {


                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "cart-item";


                element.innerHTML = `

                    <div class="cart-item-top">

                        <div>

                            <div class="cart-item-name">
                                ${item.name}
                            </div>


                            <div class="cart-item-price">

                                ${formatRupiah(
                                    item.price
                                )}

                            </div>

                        </div>

                    </div>


                    <div class="cart-item-bottom">


                        <div class="quantity-control">

                            <button
                                type="button"
                                data-action="minus"
                            >
                                -
                            </button>


                            <div class="quantity-number">
                                ${item.quantity}
                            </div>


                            <button
                                type="button"
                                data-action="plus"
                            >
                                +
                            </button>

                        </div>


                        <div class="item-subtotal">

                            ${formatRupiah(

                                item.price
                                *
                                item.quantity

                            )}

                        </div>

                    </div>

                `;


                element
                    .querySelector(
                        '[data-action="minus"]'
                    )
                    .addEventListener(

                        "click",

                        () =>
                            changeQuantity(
                                item.menuId,
                                -1
                            )

                    );


                element
                    .querySelector(
                        '[data-action="plus"]'
                    )
                    .addEventListener(

                        "click",

                        () =>
                            changeQuantity(
                                item.menuId,
                                1
                            )

                    );


                cartList.appendChild(
                    element
                );

            }

        );

    }


    const totalItem =
        document
            .getElementById(
                "totalItem"
            );


    const totalPortion =
        document
            .getElementById(
                "totalPortion"
            );


    const grandTotal =
        document
            .getElementById(
                "grandTotal"
            );


    if (
        totalItem
    ) {

        totalItem.textContent =
            cartItemCount();

    }


    if (
        totalPortion
    ) {

        totalPortion.textContent =

            `${formatPortion(
                cartPortionUsage()
            )} Porsi`;

    }


    if (
        grandTotal
    ) {

        grandTotal.textContent =
            formatRupiah(
                cartTotal()
            );

    }

}


/* =========================================
   ORDER TYPE
========================================= */

function updateOrderTypeHint() {

    const hint =
        document
            .getElementById(
                "validationStationHint"
            );


    if (!hint) {

        return;

    }


    const orderType =
        getSelectedOrderType();


    hint.textContent =

        orderType ===
        "DINE_IN"

            ?

        "📍 Pesanan akan masuk ke Meja Validasi Dine In"

            :

        "📍 Pesanan akan masuk ke Meja Validasi Take Away";

}


function setupOrderTypeControls() {

    document
        .querySelectorAll(
            'input[name="orderType"]'
        )
        .forEach(

            input => {


                input.addEventListener(

                    "change",

                    updateOrderTypeHint

                );

            }

        );


    updateOrderTypeHint();

}


function resetOrderType() {

    const takeaway =
        document
            .querySelector(
                'input[name="orderType"][value="TAKEAWAY"]'
            );


    if (
        takeaway
    ) {

        takeaway.checked =
            true;

    }


    updateOrderTypeHint();

}


/* =========================================
   TRANSACTION CODE
========================================= */

function transactionsToday() {

    return db.transactions

        .filter(

            transaction =>

                transaction.date ===
                todayISO()

        )

        .sort(

            (
                a,
                b
            ) =>

                Number(
                    b.id || 0
                )

                -

                Number(
                    a.id || 0
                )

        );

}


function generateTransactionCode() {

    const prefix =
        `TRX-${compactToday()}-`;


    const maxNumber =
        transactionsToday()

            .map(

                transaction =>
                    String(
                        transaction.transactionCode
                        ||
                        ""
                    )

            )

            .filter(

                code =>
                    code.startsWith(
                        prefix
                    )

            )

            .map(

                code =>
                    Number(
                        code.slice(
                            prefix.length
                        )
                    )

            )

            .filter(

                number =>
                    Number.isFinite(
                        number
                    )

            )

            .reduce(

                (
                    max,
                    number
                ) =>
                    Math.max(
                        max,
                        number
                    ),

                0

            );


    return (

        `${prefix}${String(
            maxNumber + 1
        ).padStart(
            3,
            "0"
        )}`

    );

}


function refreshTransactionCode() {

    const element =
        document
            .getElementById(
                "transactionCode"
            );


    if (
        element
    ) {

        element.textContent =
            generateTransactionCode();

    }

}


/* =========================================
   CREATE / ENSURE IOT VALIDATION
========================================= */

async function ensureIotValidation(
    transactionId
) {

    try {

        const result =
            await apiRequest(

                `/api/iot-validations/${transactionId}/create`,

                {

                    method:
                        "POST"

                }

            );


        return (
            result.data
            ||
            null
        );

    }

    catch (error) {

        console.error(

            "Validasi IoT belum berhasil dibuat:",

            error

        );


        return null;

    }

}


/* =========================================
   SAVE TRANSACTION
========================================= */

async function processTransaction() {

    if (
        cart.length === 0
    ) {

        showMessage(

            "Pilih minimal satu menu terlebih dahulu.",

            "error"

        );


        return;

    }


    const stockNeeded =
        cartPortionUsage();


    const currentStock =
        expectedStockToday();


    if (
        stockNeeded >
        currentStock
    ) {

        showMessage(

            `Stok tidak cukup. Stok tersedia ${formatPortion(
                currentStock
            )} porsi.`,

            "error"

        );


        return;

    }


    const transactionCodeElement =
        document
            .getElementById(
                "transactionCode"
            );


    const transactionCode =

        transactionCodeElement
            ?.textContent
            ?.trim()

        ||

        generateTransactionCode();


    const paymentMethod =

        document
            .getElementById(
                "paymentMethod"
            )
            ?.value

        ||

        "TUNAI";


    const orderType =
        getSelectedOrderType();


    const payload = {

        transactionCode,

        cashierId:
            Number(
                currentUser.id
            ),

        paymentMethod,

        orderType,

        total:
            cartTotal(),

        items:
            cart.map(

                item => ({

                    menuId:
                        Number(
                            item.menuId
                        ),

                    quantity:
                        Number(
                            item.quantity
                        ),

                    price:
                        Number(
                            item.price
                        ),

                    portionUsage:
                        Number(
                            item.portionUsage
                            ||
                            0
                        )

                })

            )

    };


    const processButton =
        document
            .getElementById(
                "processBtn"
            );


    const originalText =

        processButton
            ?.textContent

        ||

        "Simpan Transaksi";


    try {


        if (
            processButton
        ) {

            processButton.disabled =
                true;


            processButton.textContent =
                "Menyimpan...";

        }


        const result =
            await apiRequest(

                "/api/transactions",

                {

                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            payload
                        )

                }

            );


        const transactionId =
            Number(

                result.transactionId

                ??

                result.data
                    ?.transactionId

                ??

                result.data
                    ?.id

                ??

                0

            );


        if (
            !result.iotValidation

            &&

            transactionId
        ) {

            await ensureIotValidation(
                transactionId
            );

        }


        await Promise.all([

            loadTransactionsFromAPI(),

            loadIotValidationsFromAPI()

        ]);


        showMessage(

            `${transactionCode} berhasil disimpan sebagai ${orderTypeLabel(
                orderType
            )} dan masuk ke ${stationLabel(
                orderType
            )}.`,

            "success"

        );


        cart = [];


        resetOrderType();


        renderCart();

        renderStock();

        renderTransactions();

        refreshTransactionCode();

    }

    catch (error) {

        console.error(

            "Simpan transaksi gagal:",

            error

        );


        showMessage(

            error.message

            ||

            "Transaksi gagal disimpan.",

            "error"

        );

    }

    finally {

        if (
            processButton
        ) {

            processButton.disabled =
                false;


            processButton.textContent =
                originalText;

        }

    }

}


/* =========================================
   TRANSACTION HISTORY
========================================= */

function renderTransactions() {

    const table =
        document
            .getElementById(
                "transactionTable"
            );


    if (!table) {

        return;

    }


    const transactions =
        transactionsToday();


    if (
        transactions.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="
                        text-align:center;
                        color:#9ca3af;
                    "
                >

                    Belum ada transaksi hari ini.

                </td>

            </tr>

        `;


        return;

    }


    table.innerHTML =
        "";


    transactions.forEach(

        transaction => {


            const row =
                document.createElement(
                    "tr"
                );


            const user =
                getUser(
                    transaction.cashierId
                );


            const itemCount =
                (
                    transaction.items
                    ||
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
                            item.quantity
                            ||
                            0
                        ),

                    0

                );


            const orderType =
                normalizeOrderType(
                    transaction.orderType
                );


            const isOwner =

                String(
                    currentUser?.role
                    ||
                    ""
                )
                .toUpperCase()
                ===
                "OWNER";


            const action =

                transaction.status ===
                "SUCCESS"

                &&

                isOwner

                    ?

                `
                <button
                    type="button"
                    class="void-btn"
                    data-void-id="${transaction.id}"
                >
                    VOID
                </button>
                `

                    :

                transaction.status ===
                "VOID"

                    ?

                `
                <span class="void-info">

                    ${transaction.voidReason || "Dibatalkan"}

                </span>
                `

                    :

                "-";


            row.innerHTML = `

                <td>
                    ${transaction.transactionCode}
                </td>


                <td>
                    ${formatTime(
                        transaction.createdAt
                    )}
                </td>


                <td>

                    ${
                        user?.name
                        ||
                        transaction.cashierName
                        ||
                        "-"
                    }

                </td>


                <td>
                    ${itemCount}
                </td>


                <td>

                    <span
                        class="
                            order-type-badge
                            ${
                                orderType ===
                                "DINE_IN"

                                    ?

                                "dinein"

                                    :

                                "takeaway"
                            }
                        "
                    >

                        ${
                            orderType ===
                            "DINE_IN"

                                ?

                            "🍽️"

                                :

                            "🥡"
                        }

                        ${orderTypeLabel(
                            orderType
                        )}

                    </span>

                </td>


                <td>
                    ${transaction.paymentMethod || "-"}
                </td>


                <td>

                    ${formatRupiah(
                        transaction.total
                    )}

                </td>


                <td>

                    <span
                        class="
                            ${
                                transaction.status ===
                                "VOID"

                                    ?

                                "status-void"

                                    :

                                "status-success"
                            }
                        "
                    >

                        ${transaction.status}

                    </span>

                </td>


                <td>
                    ${action}
                </td>

            `;


            const voidButton =
                row
                    .querySelector(
                        "[data-void-id]"
                    );


            if (
                voidButton
            ) {

                voidButton
                    .addEventListener(

                        "click",

                        () =>
                            voidTransaction(
                                transaction.id
                            )

                    );

            }


            table.appendChild(
                row
            );

        }

    );

}


/* =========================================
   VOID TRANSACTION
========================================= */

async function voidTransaction(
    transactionId
) {

    const transaction =
        getTransaction(
            transactionId
        );


    if (!transaction) {

        return;

    }


    if (

        String(
            currentUser?.role
            ||
            ""
        )
        .toUpperCase()
        !==
        "OWNER"

    ) {

        showMessage(

            "VOID transaksi hanya dapat dilakukan Pemilik Usaha.",

            "error"

        );


        return;

    }


    const reason =
        prompt(

            `Alasan pembatalan ${transaction.transactionCode}:`

        );


    if (
        !reason

        ||

        !reason.trim()
    ) {

        return;

    }


    try {

        await apiRequest(

            `/api/transactions/${transaction.id}/void`,

            {

                method:
                    "PATCH",

                body:
                    JSON.stringify({

                        reason:
                            reason.trim()

                    })

            }

        );


        await loadTransactionsFromAPI();


        renderTransactions();

        renderStock();


        showMessage(

            `${transaction.transactionCode} berhasil dibatalkan.`,

            "success"

        );

    }

    catch (error) {

        showMessage(

            error.message

            ||

            "Gagal membatalkan transaksi.",

            "error"

        );

    }

}


/* =========================================
   IOT QUEUE
========================================= */

function iotStatusText(
    status
) {

    const value =
        String(
            status
            ||
            "PENDING"
        )
        .toUpperCase();


    if (
        value ===
        "MATCH"
    ) {

        return "SESUAI";

    }


    if (
        value ===
        "MISMATCH"
    ) {

        return "TIDAK SESUAI";

    }


    if (
        value ===
        "ERROR"
    ) {

        return "ERROR";

    }


    return "MENUNGGU";

}


function iotItemMessage(
    validation
) {

    const expected =
        Number(
            validation.expectedCount
            ||
            0
        );


    const detected =
        validation.detectedCount;


    const status =
        String(
            validation.status
            ||
            "PENDING"
        )
        .toUpperCase();


    const unit =
        validationUnit(
            validation.validationStation
        );


    if (
        status ===
        "PENDING"
    ) {

        return (

            `⏳ Menunggu validasi di ${stationLabel(
                validation.validationStation
            )}.`

        );

    }


    if (
        status ===
        "MATCH"
    ) {

        return (

            `✅ Jumlah ${unit} sesuai. Pesanan dapat diteruskan.`

        );

    }


    if (
        status ===
        "MISMATCH"
    ) {

        const difference =

            Number(
                detected || 0
            )

            -

            expected;


        if (
            difference < 0
        ) {

            return (

                `⚠️ Kurang ${Math.abs(
                    difference
                )} ${unit}. Lengkapi pesanan sebelum diserahkan.`

            );

        }


        if (
            difference > 0
        ) {

            return (

                `⚠️ Lebih ${difference} ${unit}. Periksa dan keluarkan yang berlebih.`

            );

        }


        return (

            "⚠️ Hasil validasi tidak sesuai. Periksa kembali pesanan."

        );

    }


    return (

        "⚠️ Sistem validasi mengalami kendala. Periksa pesanan secara manual."

    );

}


function renderIotQueue() {

    const list =
        document
            .getElementById(
                "iotValidationList"
            );


    const count =
        document
            .getElementById(
                "iotQueueCount"
            );


    if (!list) {

        return;

    }


    const pending =
        db.iotValidations
            .filter(

                item =>
                    item.status ===
                    "PENDING"

            );


    if (
        count
    ) {

        count.textContent =
            pending.length;

    }


    const visible =
        [
            ...db.iotValidations
        ]

        .sort(

            (
                a,
                b
            ) => {


                const aPending =

                    a.status ===
                    "PENDING"

                        ?

                    1

                        :

                    0;


                const bPending =

                    b.status ===
                    "PENDING"

                        ?

                    1

                        :

                    0;


                if (
                    aPending !==
                    bPending
                ) {

                    return (
                        bPending
                        -
                        aPending
                    );

                }


                return (

                    Number(
                        b.id || 0
                    )

                    -

                    Number(
                        a.id || 0
                    )

                );

            }

        )

        .slice(
            0,
            10
        );


    if (
        visible.length ===
        0
    ) {

        list.innerHTML = `

            <div class="iot-empty-state">

                Belum ada pesanan untuk divalidasi.

            </div>

        `;


        return;

    }


    list.innerHTML =
        "";


    visible.forEach(

        validation => {


            const status =
                String(

                    validation.status

                    ||

                    "PENDING"

                )
                .toLowerCase();


            const orderType =
                normalizeOrderType(

                    validation.validationStation

                );


            const unit =
                validationUnit(
                    orderType
                );


            const detected =

                validation.detectedCount ===
                null

                    ?

                "-"

                    :

                `${validation.detectedCount} ${unit}`;


            const confidence =

                validation.averageConfidence ===
                null

                    ?

                "-"

                    :

                `${Math.round(

                    validation.averageConfidence

                    *

                    100

                )}%`;


            const item =
                document.createElement(
                    "div"
                );


            item.className =

                `iot-queue-item ${status}`;


            item.innerHTML = `

                <div class="iot-item-top">


                    <div class="iot-item-title">


                        <span class="iot-item-code">

                            ${validation.transactionCode}

                        </span>


                        <span
                            class="
                                iot-station-badge
                                ${
                                    orderType ===
                                    "DINE_IN"

                                        ?

                                    "dinein"

                                        :

                                    "takeaway"
                                }
                            "
                        >

                            ${
                                orderType ===
                                "DINE_IN"

                                    ?

                                "🍽️"

                                    :

                                "🥡"
                            }

                            ${stationLabel(
                                orderType
                            )}

                        </span>


                    </div>


                    <span
                        class="
                            iot-status-badge
                            ${status}
                        "
                    >

                        ${iotStatusText(
                            validation.status
                        )}

                    </span>


                </div>


                <div class="iot-item-data">


                    <div class="iot-item-data-box">

                        <span>
                            Pesanan
                        </span>

                        <strong>

                            ${validation.expectedCount}
                            ${unit}

                        </strong>

                    </div>


                    <div class="iot-item-data-box">

                        <span>
                            Terdeteksi
                        </span>

                        <strong>
                            ${detected}
                        </strong>

                    </div>


                    <div class="iot-item-data-box">

                        <span>
                            Confidence
                        </span>

                        <strong>
                            ${confidence}
                        </strong>

                    </div>


                </div>


                <div class="iot-item-message">

                    ${iotItemMessage(
                        validation
                    )}

                </div>

            `;


            list.appendChild(
                item
            );

        }

    );

}


function startIotQueuePolling() {

    if (
        iotQueueTimer
    ) {

        clearInterval(
            iotQueueTimer
        );

    }


    iotQueueTimer =
        setInterval(

            loadIotValidationsFromAPI,

            1500

        );

}


/* =========================================
   EVENTS
========================================= */

function setupEvents() {

    const searchMenu =
        document
            .getElementById(
                "searchMenu"
            );


    if (
        searchMenu
    ) {

        searchMenu
            .addEventListener(

                "input",

                function () {

                    currentSearch =
                        this.value.trim();


                    renderMenu();

                }

            );

    }


    const clearCartButton =
        document
            .getElementById(
                "clearCartBtn"
            );


    if (
        clearCartButton
    ) {

        clearCartButton
            .addEventListener(

                "click",

                clearCart

            );

    }


    const processButton =
        document
            .getElementById(
                "processBtn"
            );


    if (
        processButton
    ) {

        processButton
            .addEventListener(

                "click",

                processTransaction

            );

    }

}


/* =========================================
   INITIALIZE POS
========================================= */

async function initializePOS() {

    renderUser();

    setupCategoryFilter();

    setupOrderTypeControls();

    setupEvents();

    renderCart();


    try {

        await Promise.all([

            loadMenusFromAPI(),

            loadUsersFromAPI(),

            loadTransactionsFromAPI(),

            loadProductionFromAPI(),

            loadWasteFromAPI()

        ]);


        renderStock();

        renderTransactions();

        refreshTransactionCode();


        await loadIotValidationsFromAPI();


        startIotQueuePolling();


        console.log(
            "✅ POS MYSQL + IOT SIAP"
        );

    }

    catch (error) {

        console.error(

            "Initialize POS Error:",

            error

        );


        showMessage(

            error.message

            ||

            "Sebagian data POS gagal dimuat.",

            "error"

        );

    }

}


/* =========================================
   STOP POLLING SAAT HALAMAN DITUTUP
========================================= */

window.addEventListener(

    "beforeunload",

    () => {

        if (
            iotQueueTimer
        ) {

            clearInterval(
                iotQueueTimer
            );

        }

    }

);


/* =========================================
   START
========================================= */

initializePOS();