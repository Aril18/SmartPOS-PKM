const STORAGE_KEY = "umkmControlDataV1";
const SESSION_KEY = "umkmControlSessionV1";

const currentUser =
    JSON.parse(
        localStorage.getItem(SESSION_KEY) || "null"
    );

if (!currentUser) {
    window.location.href = "../index.html";
}

const db =
    JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
    );

db.users = db.users || [];
db.menus = db.menus || [];
db.production = db.production || [];
db.transactions = db.transactions || [];
db.waste = db.waste || [];
db.stockOpnames = db.stockOpnames || [];
db.closings = db.closings || [];
db.auditLogs = db.auditLogs || [];

let cart = [];

function saveDB() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(db)
    );
}

function todayISO() {
    const now = new Date();

    const year = now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatRupiah(value) {
    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }
    ).format(Number(value || 0));
}

function formatPortion(value) {
    const number = Number(value || 0);

    if (Number.isInteger(number)) {
        return number;
    }

    return number.toFixed(1);
}

function getMenu(menuId) {
    return db.menus.find(
        menu =>
            Number(menu.id) === Number(menuId)
    );
}

function getUser(userId) {
    return db.users.find(
        user =>
            Number(user.id) === Number(userId)
    );
}

function addAudit(action, description) {
    db.auditLogs.push({
        id: Date.now(),
        userId: currentUser.id,
        action: action,
        description: description,
        createdAt: new Date().toISOString()
    });

    saveDB();
}

function productionToday() {
    const today = todayISO();

    return db.production.filter(
        item => item.date === today
    );
}

function initialStockToday() {
    return productionToday().reduce(
        (total, item) =>
            total +
            Number(item.estimatedPortion || 0),
        0
    );
}

function validTransactionsToday() {
    const today = todayISO();

    return db.transactions.filter(
        transaction =>
            transaction.date === today &&
            transaction.status !== "VOID"
    );
}

function soldPortionsToday() {
    return validTransactionsToday().reduce(
        (total, transaction) => {
            const items =
                transaction.items || [];

            const portions =
                items.reduce(
                    (subtotal, item) => {
                        const menu =
                            getMenu(item.menuId);

                        const portionUsage =
                            Number(
                                item.portionUsageAtSale ??
                                menu?.portionUsage ??
                                0
                            );

                        return (
                            subtotal +
                            (
                                Number(item.quantity || 0) *
                                portionUsage
                            )
                        );
                    },
                    0
                );

            return total + portions;
        },
        0
    );
}

function wastePortionsToday() {
    const today = todayISO();

    return db.waste
        .filter(item => {
            if (item.date) {
                return item.date === today;
            }

            if (item.createdAt) {
                return (
                    item.createdAt.substring(0, 10) === today
                );
            }

            return false;
        })
        .reduce(
            (total, item) =>
                total +
                (
                    Number(item.quantity || 0) *
                    Number(item.portionUsage ?? 1)
                ),
            0
        );
}

function expectedStockToday() {
    return (
        initialStockToday()
        -
        soldPortionsToday()
        -
        wastePortionsToday()
    );
}

function availableMenus() {
    return db.menus.filter(
        menu =>
            menu.status === "TERSEDIA"
    );
}

function renderUser() {
    document
        .getElementById("namaKasir")
        .textContent =
        currentUser.name;

    document
        .getElementById("sidebarUser")
        .textContent =
        currentUser.name;

    const dashboardLink =
        document.getElementById(
            "dashboardLink"
        );

    if (
        currentUser.role !== "OWNER"
    ) {
        dashboardLink.style.display =
            "none";
    }
}

function renderStock() {
    const stock =
        expectedStockToday();

    document
        .getElementById("stokSistem")
        .textContent =
        `${formatPortion(stock)} Porsi`;
}

function renderMenu(keyword = "") {
    const menuList =
        document.getElementById(
            "menuList"
        );

    menuList.innerHTML = "";

    const filteredMenus =
        availableMenus().filter(
            menu =>
                menu.name
                    .toLowerCase()
                    .includes(
                        keyword.toLowerCase()
                    )
                ||
                menu.category
                    .toLowerCase()
                    .includes(
                        keyword.toLowerCase()
                    )
        );

    if (
        filteredMenus.length === 0
    ) {
        menuList.innerHTML =
            "<p>Menu tidak ditemukan.</p>";

        return;
    }

    filteredMenus.forEach(menu => {
        const card =
            document.createElement("div");

        card.className =
            "menu-card";

        card.innerHTML = `
            <div class="menu-category">
                ${menu.category}
            </div>

            <div class="menu-name">
                ${menu.name}
            </div>

            <div class="menu-price">
                ${formatRupiah(menu.price)}
            </div>

            <div class="menu-portion">
                Penggunaan stok:
                ${formatPortion(menu.portionUsage)}
                porsi
            </div>
        `;

        card.addEventListener(
            "click",
            () => addToCart(menu.id)
        );

        menuList.appendChild(card);
    });
}

function addToCart(menuId) {
    const menu =
        getMenu(menuId);

    if (!menu) return;

    const existing =
        cart.find(
            item =>
                Number(item.menuId)
                ===
                Number(menuId)
        );

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            menuId: menu.id,
            name: menu.name,
            price: Number(menu.price),
            quantity: 1,
            portionUsage:
                Number(menu.portionUsage || 0)
        });
    }

    renderCart();
}

function changeQuantity(
    menuId,
    change
) {
    const item =
        cart.find(
            item =>
                Number(item.menuId)
                ===
                Number(menuId)
        );

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        cart =
            cart.filter(
                cartItem =>
                    Number(cartItem.menuId)
                    !==
                    Number(menuId)
            );
    }

    renderCart();
}

function cartTotal() {
    return cart.reduce(
        (total, item) =>
            total +
            (
                Number(item.price) *
                Number(item.quantity)
            ),
        0
    );
}

function cartItemCount() {
    return cart.reduce(
        (total, item) =>
            total +
            Number(item.quantity),
        0
    );
}

function cartPortionUsage() {
    return cart.reduce(
        (total, item) =>
            total +
            (
                Number(item.quantity) *
                Number(item.portionUsage)
            ),
        0
    );
}

function renderCart() {
    const cartList =
        document.getElementById(
            "cartList"
        );

    cartList.innerHTML = "";

    if (cart.length === 0) {
        cartList.innerHTML = `
            <div class="empty-cart">
                Belum ada menu dipilih.
            </div>
        `;
    } else {
        cart.forEach(item => {
            const cartItem =
                document.createElement(
                    "div"
                );

            cartItem.className =
                "cart-item";

            cartItem.innerHTML = `
                <div class="cart-item-top">
                    <div>
                        <div class="cart-item-name">
                            ${item.name}
                        </div>

                        <div class="cart-item-price">
                            ${formatRupiah(item.price)}
                        </div>
                    </div>
                </div>

                <div class="cart-item-bottom">

                    <div class="quantity-control">

                        <button
                            onclick="changeQuantity(${item.menuId}, -1)"
                        >
                            -
                        </button>

                        <div class="quantity-number">
                            ${item.quantity}
                        </div>

                        <button
                            onclick="changeQuantity(${item.menuId}, 1)"
                        >
                            +
                        </button>

                    </div>

                    <div class="item-subtotal">
                        ${formatRupiah(
                            item.price *
                            item.quantity
                        )}
                    </div>

                </div>
            `;

            cartList.appendChild(
                cartItem
            );
        });
    }

    document
        .getElementById("totalItem")
        .textContent =
        cartItemCount();

    document
        .getElementById("totalPortion")
        .textContent =
        `${formatPortion(
            cartPortionUsage()
        )} Porsi`;

    document
        .getElementById("grandTotal")
        .textContent =
        formatRupiah(
            cartTotal()
        );
}

function generateTransactionCode() {
    const date =
        todayISO().replaceAll(
            "-",
            ""
        );

    const transactionsToday =
        db.transactions.filter(
            transaction =>
                transaction.date ===
                todayISO()
        );

    const number =
        String(
            transactionsToday.length + 1
        ).padStart(
            3,
            "0"
        );

    return (
        `TRX-${date}-${number}`
    );
}

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

    if (type === "success") {
        box.style.background =
            "#dcfce7";

        box.style.color =
            "#166534";

        box.style.border =
            "1px solid #bbf7d0";
    } else {
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

function processTransaction() {
    if (cart.length === 0) {
        showMessage(
            "Belum ada menu dalam pesanan.",
            "error"
        );

        return;
    }

    const stock =
        expectedStockToday();

    const requiredPortion =
        cartPortionUsage();

    if (
        requiredPortion > stock
    ) {
        showMessage(
            `Stok tidak cukup. Stok tersedia ${formatPortion(stock)} porsi.`,
            "error"
        );

        return;
    }

    const transactionCode =
        generateTransactionCode();

    const paymentMethod =
        document
            .getElementById(
                "paymentMethod"
            )
            .value;

    const transaction = {
        id: Date.now(),

        transactionCode:
            transactionCode,

        cashierId:
            currentUser.id,

        date:
            todayISO(),

        createdAt:
            new Date().toISOString(),

        paymentMethod:
            paymentMethod,

        total:
            cartTotal(),

        status:
            "SUCCESS",

        items:
            cart.map(
                item => ({
                    menuId:
                        item.menuId,

                    nameAtSale:
                        item.name,

                    quantity:
                        item.quantity,

                    price:
                        item.price,

                    subtotal:
                        item.price *
                        item.quantity,

                    portionUsageAtSale:
                        item.portionUsage
                })
            )
    };

    db.transactions.push(
        transaction
    );

    saveDB();

    addAudit(
        "CREATE_TRANSACTION",
        `${transactionCode} ${formatRupiah(
            transaction.total
        )}`
    );

    showMessage(
        `${transactionCode} berhasil disimpan.`,
        "success"
    );

    cart = [];

    renderCart();
    renderStock();
    renderTransactions();

    document
        .getElementById(
            "transactionCode"
        )
        .textContent =
        generateTransactionCode();
}

function transactionsToday() {
    return db.transactions
        .filter(
            transaction =>
                transaction.date ===
                todayISO()
        )
        .sort(
            (a, b) =>
                new Date(
                    b.createdAt || 0
                )
                -
                new Date(
                    a.createdAt || 0
                )
        );
}

function renderTransactions() {
    const table =
        document.getElementById(
            "transactionTable"
        );

    table.innerHTML = "";

    const transactions =
        transactionsToday();

    if (
        transactions.length === 0
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
                    Belum ada transaksi hari ini.
                </td>
            </tr>
        `;

        return;
    }

    transactions.forEach(
        transaction => {
            const cashier =
                getUser(
                    transaction.cashierId
                );

            const itemCount =
                (
                    transaction.items || []
                ).reduce(
                    (total, item) =>
                        total +
                        Number(
                            item.quantity || 0
                        ),
                    0
                );

            let time = "-";

            if (
                transaction.createdAt
            ) {
                time =
                    new Date(
                        transaction.createdAt
                    )
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

            const statusClass =
                transaction.status ===
                "VOID"
                    ?
                    "status-void"
                    :
                    "status-success";

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    ${transaction.transactionCode}
                </td>

                <td>
                    ${time}
                </td>

                <td>
                    ${cashier?.name || "-"}
                </td>

                <td>
                    ${itemCount}
                </td>

                <td>
                    ${transaction.paymentMethod || "-"}
                </td>

                <td>
                    ${formatRupiah(transaction.total)}
                </td>

                <td>
                    <span class="${statusClass}">
                        ${transaction.status}
                    </span>
                </td>
            `;

            table.appendChild(
                row
            );
        }
    );
}

function clearCart() {
    if (cart.length === 0) {
        return;
    }

    const confirmed =
        confirm(
            "Kosongkan semua pesanan?"
        );

    if (!confirmed) {
        return;
    }

    cart = [];

    renderCart();
}

function logout() {
    localStorage.removeItem(
        SESSION_KEY
    );

    window.location.href =
        "../index.html";
}

document
    .getElementById(
        "searchMenu"
    )
    .addEventListener(
        "input",
        function () {
            renderMenu(
                this.value
            );
        }
    );

document
    .getElementById(
        "clearCartBtn"
    )
    .addEventListener(
        "click",
        clearCart
    );

document
    .getElementById(
        "processBtn"
    )
    .addEventListener(
        "click",
        processTransaction
    );

renderUser();
renderStock();
renderMenu();
renderCart();
renderTransactions();

document
    .getElementById(
        "transactionCode"
    )
    .textContent =
    generateTransactionCode();