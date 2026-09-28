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

let menus = [];


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
   FORMAT RUPIAH
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


/* =========================================
   FORMAT PORSI
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
        .toFixed(2)
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
   LOAD MENU MYSQL
========================================= */

async function loadMenus() {

    try {

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


        renderSummary();

        renderMenuTable(
            document
                .getElementById(
                    "searchMenu"
                )
                ?.value || ""
        );

    }

    catch (error) {

        console.error(
            "❌ Load Menu Error:",
            error
        );


        alert(
            error.message ||
            "Gagal mengambil data menu."
        );

    }

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

}


/* =========================================
   SUMMARY
========================================= */

function renderSummary() {

    const totalMenu =
        menus.length;


    const available =
        menus.filter(
            menu =>
                String(
                    menu.status
                ).toUpperCase()
                ===
                "TERSEDIA"
        ).length;


    const unavailable =
        menus.filter(
            menu =>
                String(
                    menu.status
                ).toUpperCase()
                ===
                "TIDAK TERSEDIA"
        ).length;


    const totalElement =
        document.getElementById(
            "totalMenu"
        );


    const availableElement =
        document.getElementById(
            "menuTersedia"
        );


    const unavailableElement =
        document.getElementById(
            "menuTidakTersedia"
        );


    if (totalElement) {

        totalElement.textContent =
            totalMenu;

    }


    if (availableElement) {

        availableElement.textContent =
            available;

    }


    if (unavailableElement) {

        unavailableElement.textContent =
            unavailable;

    }

}


/* =========================================
   RENDER TABLE
========================================= */

function renderMenuTable(
    keyword = ""
) {

    const menuTable =
        document.getElementById(
            "menuTable"
        );


    if (!menuTable) {

        return;

    }


    menuTable.innerHTML =
        "";


    const search =
        String(
            keyword || ""
        )
            .toLowerCase()
            .trim();


    const filteredMenus =
        menus.filter(
            menu => {

                return (

                    String(
                        menu.code || ""
                    )
                        .toLowerCase()
                        .includes(
                            search
                        )

                    ||

                    String(
                        menu.name || ""
                    )
                        .toLowerCase()
                        .includes(
                            search
                        )

                    ||

                    String(
                        menu.category || ""
                    )
                        .toLowerCase()
                        .includes(
                            search
                        )

                );

            }
        );


    if (
        filteredMenus.length ===
        0
    ) {

        menuTable.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        color:#9ca3af;
                    "
                >
                    Menu tidak ditemukan.
                </td>

            </tr>

        `;


        return;

    }


    filteredMenus.forEach(
        menu => {

            const row =
                document.createElement(
                    "tr"
                );


            const status =
                String(
                    menu.status ||
                    "TERSEDIA"
                )
                    .toUpperCase();


            row.innerHTML = `

                <td>
                    ${menu.code}
                </td>

                <td>
                    ${menu.name}
                </td>

                <td>
                    ${menu.category}
                </td>

                <td>
                    ${formatRupiah(
                        menu.price
                    )}
                </td>

                <td>
                    ${formatPortion(
                        menu.portionUsage
                    )} Porsi
                </td>

                <td>

                    <span
                        class="status ${
                            status ===
                            "TERSEDIA"

                                ? "available"

                                : "unavailable"
                        }"
                    >
                        ${status}
                    </span>

                </td>

                <td>

                    <button
                        type="button"
                        class="edit-button"
                        onclick="editMenu(${menu.id})"
                    >
                        Edit
                    </button>

                </td>

            `;


            menuTable.appendChild(
                row
            );

        }
    );

}


/* =========================================
   SIMPAN MENU MYSQL
========================================= */

async function saveMenu(event) {

    event.preventDefault();


    const menuId =
        document
            .getElementById(
                "menuId"
            )
            .value;


    const menuCode =
        document
            .getElementById(
                "menuCode"
            )
            .value
            .trim();


    const menuName =
        document
            .getElementById(
                "menuName"
            )
            .value
            .trim();


    const menuCategory =
        document
            .getElementById(
                "menuCategory"
            )
            .value;


    const menuPrice =
        Number(
            document
                .getElementById(
                    "menuPrice"
                )
                .value
        );


    const portionUsage =
        Number(
            document
                .getElementById(
                    "portionUsage"
                )
                .value
        );


    const menuStatus =
        document
            .getElementById(
                "menuStatus"
            )
            .value;


    if (
        !menuCode ||
        !menuName ||
        !menuCategory ||
        Number.isNaN(
            menuPrice
        ) ||
        menuPrice < 0 ||
        Number.isNaN(
            portionUsage
        ) ||
        portionUsage < 0
    ) {

        alert(
            "Lengkapi data menu dengan benar."
        );


        return;

    }


    const payload = {

        code:
            menuCode,

        name:
            menuName,

        category:
            menuCategory,

        price:
            menuPrice,

        portionUsage:
            portionUsage,

        status:
            menuStatus,

        actorUserId:
            Number(
                currentUser.id
            )

    };


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


        if (menuId) {

            await apiRequest(
                `/api/menus/${menuId}`,
                {

                    method:
                        "PATCH",

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


            alert(
                "Menu berhasil diperbarui."
            );

        }

        else {

            await apiRequest(
                "/api/menus",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


            alert(
                "Menu berhasil ditambahkan."
            );

        }


        await loadMenus();


        resetForm();

    }

    catch (error) {

        console.error(
            "❌ Simpan Menu Error:",
            error
        );


        alert(
            error.message ||
            "Gagal menyimpan menu."
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
   EDIT MENU
========================================= */

function editMenu(menuId) {

    const menu =
        menus.find(
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

        alert(
            "Menu tidak ditemukan."
        );


        return;

    }


    document
        .getElementById(
            "menuId"
        )
        .value =
        menu.id;


    document
        .getElementById(
            "menuCode"
        )
        .value =
        menu.code;


    document
        .getElementById(
            "menuName"
        )
        .value =
        menu.name;


    document
        .getElementById(
            "menuCategory"
        )
        .value =
        menu.category;


    document
        .getElementById(
            "menuPrice"
        )
        .value =
        menu.price;


    document
        .getElementById(
            "portionUsage"
        )
        .value =
        menu.portionUsage;


    document
        .getElementById(
            "menuStatus"
        )
        .value =
        menu.status;


    const formTitle =
        document.getElementById(
            "formTitle"
        );


    if (formTitle) {

        formTitle.textContent =
            "Edit Menu";

    }


    const cancelButton =
        document.getElementById(
            "cancelButton"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "inline-block";

    }


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

}


/* =========================================
   RESET FORM
========================================= */

function resetForm() {

    const form =
        document.getElementById(
            "menuForm"
        );


    if (form) {

        form.reset();

    }


    const menuId =
        document.getElementById(
            "menuId"
        );


    if (menuId) {

        menuId.value =
            "";

    }


    const formTitle =
        document.getElementById(
            "formTitle"
        );


    if (formTitle) {

        formTitle.textContent =
            "Tambah Menu";

    }


    const status =
        document.getElementById(
            "menuStatus"
        );


    if (status) {

        status.value =
            "TERSEDIA";

    }


    const cancelButton =
        document.getElementById(
            "cancelButton"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "none";

    }

}


/* =========================================
   CANCEL EDIT
========================================= */

function cancelEdit() {

    resetForm();

}


/* =========================================
   SEARCH
========================================= */

const searchMenu =
    document.getElementById(
        "searchMenu"
    );


if (searchMenu) {

    searchMenu.addEventListener(

        "input",

        function () {

            renderMenuTable(
                this.value
            );

        }

    );

}


/* =========================================
   FORM
========================================= */

const menuForm =
    document.getElementById(
        "menuForm"
    );


if (menuForm) {

    menuForm.addEventListener(

        "submit",

        saveMenu

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

async function initializeMenuPage() {

    renderUser();


    const cancelButton =
        document.getElementById(
            "cancelButton"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "none";

    }


    await loadMenus();


    console.log(
        "✅ MENU MYSQL SIAP"
    );

}


initializeMenuPage();