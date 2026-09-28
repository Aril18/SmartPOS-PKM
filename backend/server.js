const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");

require("dotenv").config();

const {
    pool,
    testConnection
} = require("./config/database");


const app = express();


/* =========================================
   MIDDLEWARE
========================================= */

app.use(cors());

app.use(express.json());

/* =========================================
   AUTO AUDIT MIDDLEWARE
   Mencatat aktivitas sukses ke audit_logs
========================================= */

async function getAuditDefaultOwnerId() {

    try {

        const [rows] =
            await pool.query(
                `
                SELECT id

                FROM users

                WHERE role = 'OWNER'

                ORDER BY
                    CASE
                        WHEN status = 'AKTIF'
                        THEN 0
                        ELSE 1
                    END,
                    id ASC

                LIMIT 1
                `
            );


        return rows.length
            ? Number(
                rows[0].id
            )
            : null;

    }

    catch (error) {

        console.error(
            "Audit owner lookup error:",
            error.message
        );


        return null;

    }

}


async function saveAutomaticAudit(
    userId,
    action,
    description
) {

    try {

        const finalUserId =
            Number(
                userId
            )
            ||
            await getAuditDefaultOwnerId();


        if (
            !finalUserId ||
            !action
        ) {

            return;

        }


        await pool.query(
            `
            INSERT INTO audit_logs
            (
                user_id,
                action,
                description
            )

            VALUES
            (
                ?,
                ?,
                ?
            )
            `,
            [
                finalUserId,

                String(
                    action
                )
                    .trim()
                    .toUpperCase(),

                description
                    ?
                    String(
                        description
                    ).trim()
                    :
                    null
            ]
        );

    }

    catch (error) {

        /*
         * Kalau audit gagal,
         * proses utama tetap tidak boleh gagal.
         */

        console.error(
            "Automatic Audit Error:",
            error.message
        );

    }

}


async function buildAutomaticAudit(
    req,
    responseBody
) {

    const method =
        String(
            req.method || ""
        ).toUpperCase();


    const path =
        req.path;


    const body =
        req.body || {};


    /*
     * Jangan audit endpoint audit itu sendiri.
     * Kalau tidak, bisa dobel.
     */

    if (
        path ===
        "/api/audit-logs"
    ) {

        return;

    }


    /* =====================================
       LOGIN
    ===================================== */

    if (
        method === "POST" &&
        path === "/api/login" &&
        responseBody?.user?.id
    ) {

        await saveAutomaticAudit(

            responseBody.user.id,

            "LOGIN",

            `${responseBody.user.name} login sebagai ${responseBody.user.role}`

        );


        return;

    }
/* =====================================
   TAMBAH MENU
===================================== */

if (
    method === "POST" &&
    path === "/api/menus"
) {

    await saveAutomaticAudit(

        body.actorUserId,

        "TAMBAH MENU",

        `Menambahkan menu ${body.name || "-"} (${body.code || "-"})`

    );


    return;

}


/* =====================================
   UPDATE MENU
===================================== */

if (
    method === "PATCH" &&
    /^\/api\/menus\/\d+$/
        .test(
            path
        )
) {

    const menuId =
        Number(
            path.split(
                "/"
            )[3]
        );


    await saveAutomaticAudit(

        body.actorUserId,

        "UPDATE MENU",

        `Mengubah menu ${body.name || "-"} (${body.code || "-"}) - ID ${menuId}`

    );


    return;

}

    /* =====================================
       TRANSAKSI
    ===================================== */

    if (
        method === "POST" &&
        path === "/api/transactions"
    ) {

        await saveAutomaticAudit(

            body.cashierId,

            "TRANSAKSI",

            `${body.transactionCode || "Transaksi"} - ${String(
                body.paymentMethod || "-"
            ).toUpperCase()} - Rp${Number(
                body.total || 0
            ).toLocaleString(
                "id-ID"
            )}`

        );


        return;

    }


    /* =====================================
       VOID TRANSAKSI
    ===================================== */

    if (
        method === "PATCH" &&
        /^\/api\/transactions\/\d+\/void$/
            .test(
                path
            )
    ) {

        const transactionId =
            Number(
                path.split(
                    "/"
                )[3]
            );


        let fallbackUserId =
            null;


        let transactionCode =
            `ID ${transactionId}`;


        try {

            const [rows] =
                await pool.query(
                    `
                    SELECT
                        cashier_id,
                        transaction_code

                    FROM transactions

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [
                        transactionId
                    ]
                );


            if (
                rows.length > 0
            ) {

                fallbackUserId =
                    Number(
                        rows[0]
                            .cashier_id
                    );


                transactionCode =
                    rows[0]
                        .transaction_code;

            }

        }

        catch (error) {

            console.error(
                "Audit VOID lookup error:",
                error.message
            );

        }


        await saveAutomaticAudit(

            body.actorUserId
            ||
            fallbackUserId,

            "VOID TRANSAKSI",

            `${transactionCode} dibatalkan - ${body.reason || "-"}`

        );


        return;

    }


    /* =====================================
       TAMBAH PEGAWAI
    ===================================== */

    if (
        method === "POST" &&
        path === "/api/users"
    ) {

        await saveAutomaticAudit(

            body.actorUserId,

            "TAMBAH PEGAWAI",

            `Menambahkan pegawai ${body.name || "-"} (${String(
                body.role || "KASIR"
            ).toUpperCase()})`

        );


        return;

    }


    /* =====================================
       UPDATE PEGAWAI
    ===================================== */

    if (
        method === "PATCH" &&
        /^\/api\/users\/\d+$/
            .test(
                path
            )
    ) {

        await saveAutomaticAudit(

            body.actorUserId,

            "UPDATE PEGAWAI",

            `Mengubah data pegawai ID ${path.split(
                "/"
            )[3]}${
                body.name
                    ?
                    ` menjadi ${body.name}`
                    :
                    ""
            }${
                body.status
                    ?
                    `, status ${body.status}`
                    :
                    ""
            }`

        );


        return;

    }


    /* =====================================
       GANTI PASSWORD
    ===================================== */

    if (
        method === "PATCH" &&
        /^\/api\/users\/\d+\/password$/
            .test(
                path
            )
    ) {

        await saveAutomaticAudit(

            body.actorUserId,

            "GANTI PASSWORD",

            `Mengganti password pengguna ID ${path.split(
                "/"
            )[3]}`

        );


        return;

    }


    /* =====================================
       PRODUKSI
    ===================================== */

    if (
        method === "POST" &&
        path === "/api/production"
    ) {

        await saveAutomaticAudit(

            body.createdBy,

            "PRODUKSI",

            `Produksi ${body.ingredient || "-"} sebanyak ${Number(
                body.estimatedPortion || 0
            )} porsi`

        );


        return;

    }


    /* =====================================
       WASTE
    ===================================== */

    if (
        method === "POST" &&
        path === "/api/waste"
    ) {

        const stockImpact =
            Number(
                body.quantity || 0
            )
            *
            Number(
                body.portionUsage || 0
            );


        await saveAutomaticAudit(

            body.userId,

            "WASTE",

            `${body.itemName || "-"} - ${stockImpact} porsi - ${body.reason || "-"}`

        );


        return;

    }


    /* =====================================
       STOCK OPNAME
    ===================================== */

    if (
        method === "POST" &&
        path === "/api/stock-opnames"
    ) {

        const expectedStock =
            Number(
                body.expectedStock || 0
            );


        const physicalStock =
            Number(
                body.physicalStock || 0
            );


        const difference =
            expectedStock -
            physicalStock;


        await saveAutomaticAudit(

            body.createdBy,

            "STOCK OPNAME",

            `Stok sistem ${expectedStock} porsi, stok fisik ${physicalStock} porsi, selisih ${difference} porsi`

        );


        return;

    }


    /* =====================================
       CLOSING
    ===================================== */

    if (
        method === "POST" &&
        path === "/api/closings"
    ) {

        const closing =
            responseBody?.data
            ||
            {};


        await saveAutomaticAudit(

            body.cashierId,

            "CLOSING",

            `Closing ${body.date || "-"} - kas sistem Rp${Number(
                closing.systemCash || 0
            ).toLocaleString(
                "id-ID"
            )}, kas fisik Rp${Number(
                closing.actualCash
                ??
                body.actualCash
                ??
                0
            ).toLocaleString(
                "id-ID"
            )}, selisih Rp${Number(
                closing.cashDifference || 0
            ).toLocaleString(
                "id-ID"
            )} - ${closing.status || "-"}`

        );


        return;

    }

}


/* =========================================
   INTERCEPT RESPONSE SUKSES
========================================= */

app.use(
    (
        req,
        res,
        next
    ) => {

        const originalJson =
            res.json.bind(
                res
            );


        res.json =
            function (
                body
            ) {

                const shouldAudit =

                    [
                        "POST",
                        "PATCH",
                        "PUT",
                        "DELETE"
                    ]
                        .includes(
                            String(
                                req.method
                            )
                                .toUpperCase()
                        )

                    &&

                    body

                    &&

                    body.success === true

                    &&

                    req.path !==
                    "/api/audit-logs";


                if (
                    !shouldAudit
                ) {

                    return originalJson(
                        body
                    );

                }


                Promise
                    .resolve(
                        buildAutomaticAudit(
                            req,
                            body
                        )
                    )

                    .catch(
                        error => {

                            console.error(
                                "Audit middleware error:",
                                error
                            );

                        }
                    )

                    .finally(
                        () => {

                            originalJson(
                                body
                            );

                        }
                    );


                return res;

            };


        next();

    }
);


/* =========================================
   TEST API
========================================= */

app.get("/", (req, res) => {

    res.json({
        message: "SmartPOS API berjalan"
    });

});


/* =========================================
   TEST DATABASE
========================================= */

app.get("/api/health", async (req, res) => {

    try {

        const [result] =
            await pool.query(
                "SELECT 1 AS database_status"
            );


        res.json({

            success: true,

            message:
                "Backend dan database terhubung",

            database:
                result[0]

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message:
                "Database gagal terhubung",

            error:
                error.message

        });

    }

});


/* =========================================
   GET ALL MENUS
========================================= */

app.get(
    "/api/menus",
    async (req, res) => {

        try {

            const [menus] =
                await pool.query(`
                    SELECT
                        id,
                        code,
                        name,
                        category,
                        price,
                        portion_usage AS portionUsage,
                        status
                    FROM menus
                    ORDER BY id ASC
                `);


            res.json({

                success: true,

                data: menus

            });

        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Gagal mengambil data menu",

                error:
                    error.message

            });

        }

    }
);

/* =========================================
   POST MENU / TAMBAH MENU
========================================= */

app.post(
    "/api/menus",
    async (req, res) => {

        try {

            const {
                code,
                name,
                category,
                price,
                portionUsage,
                status = "TERSEDIA"
            } = req.body;


            if (
                !code ||
                !name ||
                !category ||
                price === undefined ||
                portionUsage === undefined
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Data menu belum lengkap."

                    });

            }


            const menuPrice =
                Number(price);


            const menuPortion =
                Number(portionUsage);


            if (
                Number.isNaN(menuPrice) ||
                menuPrice < 0 ||
                Number.isNaN(menuPortion) ||
                menuPortion < 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Harga atau penggunaan stok tidak valid."

                    });

            }


            const normalizedStatus =
                String(status)
                    .toUpperCase();


            if (
                ![
                    "TERSEDIA",
                    "TIDAK TERSEDIA"
                ].includes(
                    normalizedStatus
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Status menu tidak valid."

                    });

            }


            const [result] =
                await pool.query(
                    `
                    INSERT INTO menus
                    (
                        code,
                        name,
                        category,
                        price,
                        portion_usage,
                        status
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        String(code).trim(),
                        String(name).trim(),
                        String(category).trim(),

                        menuPrice,

                        menuPortion,

                        normalizedStatus
                    ]
                );


            res.status(201).json({

                success: true,

                message:
                    "Menu berhasil ditambahkan.",

                menuId:
                    result.insertId

            });

        }

        catch (error) {

            console.error(
                "Create Menu Error:",
                error
            );


            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {

                return res
                    .status(409)
                    .json({

                        success: false,

                        message:
                            "Kode menu sudah digunakan."

                    });

            }


            res.status(500).json({

                success: false,

                message:
                    "Gagal menambahkan menu.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   PATCH MENU / UPDATE MENU
========================================= */

app.patch(
    "/api/menus/:id",
    async (req, res) => {

        try {

            const menuId =
                Number(
                    req.params.id
                );


            if (!menuId) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "ID menu tidak valid."

                    });

            }


            const {
                code,
                name,
                category,
                price,
                portionUsage,
                status
            } = req.body;


            const [existing] =
                await pool.query(
                    `
                    SELECT
                        id,
                        code,
                        name,
                        category,
                        price,
                        portion_usage,
                        status

                    FROM menus

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [
                        menuId
                    ]
                );


            if (
                existing.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Menu tidak ditemukan."

                    });

            }


            const oldMenu =
                existing[0];


            const nextCode =
                code !== undefined
                    ? String(code).trim()
                    : oldMenu.code;


            const nextName =
                name !== undefined
                    ? String(name).trim()
                    : oldMenu.name;


            const nextCategory =
                category !== undefined
                    ? String(category).trim()
                    : oldMenu.category;


            const nextPrice =
                price !== undefined
                    ? Number(price)
                    : Number(oldMenu.price);


            const nextPortion =
                portionUsage !== undefined
                    ? Number(portionUsage)
                    : Number(
                        oldMenu.portion_usage
                    );


            const nextStatus =
                status !== undefined
                    ? String(status)
                        .toUpperCase()
                    : oldMenu.status;


            if (
                !nextCode ||
                !nextName ||
                !nextCategory
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Kode, nama, dan kategori menu wajib diisi."

                    });

            }


            if (
                Number.isNaN(nextPrice) ||
                nextPrice < 0 ||
                Number.isNaN(nextPortion) ||
                nextPortion < 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Harga atau penggunaan stok tidak valid."

                    });

            }


            if (
                ![
                    "TERSEDIA",
                    "TIDAK TERSEDIA"
                ].includes(
                    nextStatus
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Status menu tidak valid."

                    });

            }


            await pool.query(
                `
                UPDATE menus

                SET
                    code = ?,
                    name = ?,
                    category = ?,
                    price = ?,
                    portion_usage = ?,
                    status = ?

                WHERE id = ?
                `,
                [
                    nextCode,
                    nextName,
                    nextCategory,
                    nextPrice,
                    nextPortion,
                    nextStatus,
                    menuId
                ]
            );


            res.json({

                success: true,

                message:
                    "Menu berhasil diperbarui."

            });

        }

        catch (error) {

            console.error(
                "Update Menu Error:",
                error
            );


            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {

                return res
                    .status(409)
                    .json({

                        success: false,

                        message:
                            "Kode menu sudah digunakan."

                    });

            }


            res.status(500).json({

                success: false,

                message:
                    "Gagal memperbarui menu.",

                error:
                    error.message

            });

        }

    }
);
// =====================================================
// POST TRANSACTION + AUTO IOT VALIDATION
// =====================================================

app.post(
    "/api/transactions",
    async (req, res) => {

        const connection =
            await pool.getConnection();

        try {

            const {

                transactionCode,

                cashierId,

                paymentMethod,

                orderType = "TAKEAWAY",

                total,

                items

            } = req.body;


            const normalizedOrderType =
                String(
                    orderType ||
                    "TAKEAWAY"
                )
                .trim()
                .toUpperCase()
                .replaceAll(
                    " ",
                    "_"
                );


            /* =========================================
               VALIDASI DASAR
            ========================================= */

            if (

                !transactionCode ||

                !cashierId ||

                !paymentMethod ||

                !Array.isArray(items) ||

                items.length === 0

            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Data transaksi tidak lengkap."

                    });

            }


            if (
                ![
                    "TAKEAWAY",
                    "DINE_IN"
                ].includes(
                    normalizedOrderType
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Tipe pesanan tidak valid."

                    });

            }


            await connection
                .beginTransaction();


            /* =========================================
               1. SIMPAN TRANSAKSI
            ========================================= */

            const [transactionResult] =
                await connection.query(
                    `
                    INSERT INTO transactions
                    (
                        transaction_code,
                        cashier_id,
                        transaction_date,
                        payment_method,
                        order_type,
                        total,
                        status
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        NOW(),
                        ?,
                        ?,
                        ?,
                        'SUCCESS'
                    )
                    `,
                    [

                        transactionCode,

                        cashierId,

                        paymentMethod,

                        normalizedOrderType,

                        Number(
                            total || 0
                        )

                    ]
                );


            const transactionId =
                transactionResult.insertId;


            /* =========================================
               2. SIMPAN ITEM TRANSAKSI
            ========================================= */

            let expectedCount =
                0;


            for (
                const item of items
            ) {

                const quantity =
                    Number(
                        item.quantity || 0
                    );


                const price =
                    Number(
                        item.price || 0
                    );


                const portionUsage =
                    Number(
                        item.portionUsage || 0
                    );


                if (
                    quantity <= 0
                ) {

                    throw new Error(
                        "Jumlah item transaksi tidak valid."
                    );

                }


                const subtotal =
                    price *
                    quantity;


                /*
                 * Untuk prototype:
                 * 1 quantity = 1 objek validasi.
                 *
                 * TAKEAWAY = jumlah kemasan.
                 * DINE_IN  = jumlah sajian/piring.
                 */
                expectedCount +=
                    quantity;


                await connection.query(
                    `
                    INSERT INTO transaction_items
                    (
                        transaction_id,
                        menu_id,
                        quantity,
                        price,
                        portion_usage,
                        subtotal
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [

                        transactionId,

                        item.menuId,

                        quantity,

                        price,

                        portionUsage,

                        subtotal

                    ]
                );

            }


            /* =========================================
               3. BUAT JOB IOT OTOMATIS
            ========================================= */

            const [iotResult] =
                await connection.query(
                    `
                    INSERT INTO iot_validations
                    (
                        transaction_id,
                        validation_station,
                        expected_count,
                        status
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        'PENDING'
                    )
                    `,
                    [

                        transactionId,

                        normalizedOrderType,

                        expectedCount

                    ]
                );


            const iotValidationId =
                iotResult.insertId;


            /* =========================================
               4. COMMIT
            ========================================= */

            await connection
                .commit();


            /* =========================================
               RESPONSE
            ========================================= */

            res.status(201).json({

                success: true,

                message:
                    "Transaksi berhasil disimpan dan menunggu validasi IoT.",

                transactionId:
                    transactionId,

                transactionCode:
                    transactionCode,

                orderType:
                    normalizedOrderType,

                iotValidation: {

                    id:
                        iotValidationId,

                    transactionId:
                        transactionId,

                    transactionCode:
                        transactionCode,

                    validationStation:
                        normalizedOrderType,

                    expectedCount:
                        expectedCount,

                    detectedCount:
                        null,

                    status:
                        "PENDING"

                }

            });

        }

        catch (error) {

            await connection
                .rollback();


            console.error(
                "❌ Transaction + IoT Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal menyimpan transaksi.",

                error:
                    error.message

            });

        }

        finally {

            connection.release();

        }

    }
);
/* =========================================
   GET ALL TRANSACTIONS
========================================= */

app.get(
    "/api/transactions",
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(`
                    SELECT

                        t.id,
                        t.transaction_code,
                        t.cashier_id,

                        DATE_FORMAT(
                            t.transaction_date,
                            '%Y-%m-%d'
                        ) AS transaction_date,

                        DATE_FORMAT(
                            t.created_at,
                            '%Y-%m-%dT%H:%i:%s'
                        ) AS created_at,

                        t.payment_method,
                        t.order_type,
                        t.total,
                        t.status,
                        t.void_reason,
                        t.voided_at,

                        ti.id AS transaction_item_id,
                        ti.menu_id,
                        ti.quantity,
                        ti.price,
                        ti.portion_usage,
                        ti.subtotal,

                        m.name AS menu_name

                    FROM transactions t

                    LEFT JOIN transaction_items ti
                        ON ti.transaction_id = t.id

                    LEFT JOIN menus m
                        ON m.id = ti.menu_id

                    ORDER BY
                        t.transaction_date DESC,
                        t.id DESC,
                        ti.id ASC
                `);


            const transactionMap =
                new Map();


            rows.forEach(
                row => {

                    if (
                        !transactionMap.has(
                            row.id
                        )
                    ) {

                        transactionMap.set(
                            row.id,
                            {

                                id:
                                    Number(
                                        row.id
                                    ),

                                transactionCode:
                                    row.transaction_code,

                                cashierId:
                                    Number(
                                        row.cashier_id
                                    ),

                                date:
                                    row.transaction_date,

                                createdAt:
                                    row.created_at,

                                paymentMethod:
                                    row.payment_method,

                                orderType:
                                    row.order_type ||
                                    "TAKEAWAY",

                                total:
                                    Number(
                                        row.total
                                    ),

                                status:
                                    row.status,

                                voidReason:
                                    row.void_reason,

                                voidedAt:
                                    row.voided_at,

                                items:
                                    []

                            }
                        );

                    }


                    if (
                        row.transaction_item_id
                    ) {

                        transactionMap
                            .get(
                                row.id
                            )
                            .items
                            .push({

                                id:
                                    Number(
                                        row.transaction_item_id
                                    ),

                                menuId:
                                    Number(
                                        row.menu_id
                                    ),

                                nameAtSale:
                                    row.menu_name,

                                quantity:
                                    Number(
                                        row.quantity
                                    ),

                                price:
                                    Number(
                                        row.price
                                    ),

                                subtotal:
                                    Number(
                                        row.subtotal
                                    ),

                                portionUsageAtSale:
                                    Number(
                                        row.portion_usage || 0
                                    )

                            });

                    }

                }
            );


            res.json({

                success:
                    true,

                data:
                    Array.from(
                        transactionMap.values()
                    )

            });

        }

        catch (error) {

            console.error(
                "Get Transaction Error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Gagal mengambil transaksi",

                error:
                    error.message

            });

        }

    }
);

/* =========================================
   VOID TRANSACTION
========================================= */

app.patch(
    "/api/transactions/:id/void",
    async (req, res) => {

        try {

            const transactionId =
                Number(
                    req.params.id
                );


            const {
                reason
            } = req.body;


            if (
                !transactionId
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "ID transaksi tidak valid"

                    });

            }


            if (
                !reason ||
                String(reason)
                    .trim() === ""
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Alasan pembatalan wajib diisi"

                    });

            }


            const [existing] =
                await pool.query(
                    `
                    SELECT
                        id,
                        status

                    FROM transactions

                    WHERE id = ?
                    `,
                    [
                        transactionId
                    ]
                );


            if (
                existing.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Transaksi tidak ditemukan"

                    });

            }


            if (
                existing[0].status ===
                "VOID"
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Transaksi sudah dibatalkan"

                    });

            }


            await pool.query(
                `
                UPDATE transactions

                SET
                    status = 'VOID',
                    void_reason = ?,
                    voided_at = NOW()

                WHERE id = ?
                `,
                [
                    String(reason)
                        .trim(),

                    transactionId
                ]
            );


            res.json({

                success:
                    true,

                message:
                    "Transaksi berhasil dibatalkan"

            });

        }

        catch (error) {

            console.error(
                "Void Transaction Error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Gagal membatalkan transaksi",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   LOGIN MYSQL
========================================= */

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;


            if (
                !username ||
                !password
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Username dan password wajib diisi."

                    });

            }


            const [users] =
                await pool.query(
                    `
                    SELECT
                        id,
                        name,
                        username,
                        password,
                        role,
                        status

                    FROM users

                    WHERE username = ?

                    LIMIT 1
                    `,
                    [
                        username
                    ]
                );


            if (
                users.length === 0
            ) {

                return res
                    .status(401)
                    .json({

                        success: false,

                        message:
                            "Username atau password salah."

                    });

            }


            const user =
                users[0];


            if (
                user.status !==
                "AKTIF"
            ) {

                return res
                    .status(403)
                    .json({

                        success: false,

                        message:
                            "Akun sedang tidak aktif."

                    });

            }


            /*
             * Support dua kondisi:
             *
             * 1. Password lama masih plaintext
             * 2. Password baru sudah bcrypt
             */

            let passwordValid =
                false;


            if (
                String(
                    user.password
                ).startsWith("$2")
            ) {

                passwordValid =
                    await bcrypt.compare(
                        password,
                        user.password
                    );

            }

            else {

                passwordValid =
                    password ===
                    user.password;

            }


            if (
                !passwordValid
            ) {

                return res
                    .status(401)
                    .json({

                        success: false,

                        message:
                            "Username atau password salah."

                    });

            }


            res.json({

                success: true,

                message:
                    "Login berhasil",

                user: {

                    id:
                        Number(
                            user.id
                        ),

                    name:
                        user.name,

                    username:
                        user.username,

                    role:
                        user.role,

                    status:
                        user.status

                }

            });

        }

        catch (error) {

            console.error(
                "Login Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Terjadi kesalahan saat login.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   GET USERS
========================================= */

app.get(
    "/api/users",
    async (req, res) => {

        try {

            const [users] =
                await pool.query(
                    `
                    SELECT
                        id,
                        name,
                        username,
                        role,
                        status,
                        created_at AS createdAt

                    FROM users

                    ORDER BY id ASC
                    `
                );


            res.json({

                success: true,

                data:
                    users.map(
                        user => ({

                            ...user,

                            id:
                                Number(
                                    user.id
                                )

                        })
                    )

            });

        }

        catch (error) {

            console.error(
                "Get Users Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal mengambil data pengguna.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   POST USER / TAMBAH PEGAWAI
========================================= */

app.post(
    "/api/users",
    async (req, res) => {

        try {

            const {
                name,
                username,
                password,
                role = "KASIR",
                status = "AKTIF"
            } = req.body;


            if (
                !name ||
                !username ||
                !password
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Nama, username, dan password wajib diisi."

                    });

            }


            const normalizedRole =
                String(role)
                    .toUpperCase();


            const normalizedStatus =
                String(status)
                    .toUpperCase();


            if (
                ![
                    "OWNER",
                    "KASIR"
                ].includes(
                    normalizedRole
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Role pengguna tidak valid."

                    });

            }


            if (
                ![
                    "AKTIF",
                    "NONAKTIF"
                ].includes(
                    normalizedStatus
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Status pengguna tidak valid."

                    });

            }


            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            const [result] =
                await pool.query(
                    `
                    INSERT INTO users
                    (
                        name,
                        username,
                        password,
                        role,
                        status
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        name,
                        username,
                        hashedPassword,
                        normalizedRole,
                        normalizedStatus
                    ]
                );


            res.status(201).json({

                success: true,

                message:
                    "Pengguna berhasil ditambahkan.",

                userId:
                    result.insertId

            });

        }

        catch (error) {

            console.error(
                "Create User Error:",
                error
            );


            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {

                return res
                    .status(409)
                    .json({

                        success: false,

                        message:
                            "Username sudah digunakan."

                    });

            }


            res.status(500).json({

                success: false,

                message:
                    "Gagal menambahkan pengguna.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   UPDATE USER
========================================= */

app.patch(
    "/api/users/:id",
    async (req, res) => {

        try {

            const userId =
                Number(
                    req.params.id
                );


            const {
                name,
                username,
                role,
                status
            } = req.body;


            if (
                !userId
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "ID pengguna tidak valid."

                    });

            }


            const normalizedRole =
                role
                    ?
                    String(role)
                        .toUpperCase()
                    :
                    null;


            const normalizedStatus =
                status
                    ?
                    String(status)
                        .toUpperCase()
                    :
                    null;


            if (
                normalizedRole &&
                ![
                    "OWNER",
                    "KASIR"
                ].includes(
                    normalizedRole
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Role pengguna tidak valid."

                    });

            }


            if (
                normalizedStatus &&
                ![
                    "AKTIF",
                    "NONAKTIF"
                ].includes(
                    normalizedStatus
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Status pengguna tidak valid."

                    });

            }


            const [existing] =
                await pool.query(
                    `
                    SELECT
                        id,
                        name,
                        username,
                        role,
                        status

                    FROM users

                    WHERE id = ?
                    `,
                    [
                        userId
                    ]
                );


            if (
                existing.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Pengguna tidak ditemukan."

                    });

            }


            const oldUser =
                existing[0];


            await pool.query(
                `
                UPDATE users

                SET
                    name = ?,
                    username = ?,
                    role = ?,
                    status = ?

                WHERE id = ?
                `,
                [
                    name ??
                    oldUser.name,

                    username ??
                    oldUser.username,

                    normalizedRole ??
                    oldUser.role,

                    normalizedStatus ??
                    oldUser.status,

                    userId
                ]
            );


            res.json({

                success: true,

                message:
                    "Data pengguna berhasil diperbarui."

            });

        }

        catch (error) {

            console.error(
                "Update User Error:",
                error
            );


            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {

                return res
                    .status(409)
                    .json({

                        success: false,

                        message:
                            "Username sudah digunakan."

                    });

            }


            res.status(500).json({

                success: false,

                message:
                    "Gagal memperbarui pengguna.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   RESET / GANTI PASSWORD USER
========================================= */

app.patch(
    "/api/users/:id/password",
    async (req, res) => {

        try {

            const userId =
                Number(
                    req.params.id
                );


            const {
                password
            } = req.body;


            if (
                !userId ||
                !password
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "ID dan password baru wajib diisi."

                    });

            }


            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            const [result] =
                await pool.query(
                    `
                    UPDATE users

                    SET password = ?

                    WHERE id = ?
                    `,
                    [
                        hashedPassword,
                        userId
                    ]
                );


            if (
                result.affectedRows ===
                0
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Pengguna tidak ditemukan."

                    });

            }


            res.json({

                success: true,

                message:
                    "Password berhasil diperbarui."

            });

        }

        catch (error) {

            console.error(
                "Password Update Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal memperbarui password.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   GET PRODUCTION
========================================= */

app.get(
    "/api/production",
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(
                    `
                    SELECT
                        id,

                        DATE_FORMAT(
                            production_date,
                            '%Y-%m-%d'
                        ) AS date,

                        ingredient,

                        stock_weight
                        AS stockWeight,

                        estimated_portion
                        AS estimatedPortion,

                        notes

                    FROM production

                    ORDER BY
                        production_date DESC,
                        id DESC
                    `
                );


            res.json({

                success:
                    true,

                data:
                    rows.map(
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
                    )

            });

        }

        catch (error) {

            console.error(
                "Get Production Error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Gagal mengambil data produksi.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   POST PRODUCTION
========================================= */

app.post(
    "/api/production",
    async (req, res) => {

        try {

            const {
                date,
                ingredient,
                stockWeight,
                estimatedPortion,
                notes
            } = req.body;


            if (
                !date ||
                !ingredient ||
                Number(stockWeight) <= 0 ||
                Number(estimatedPortion) <= 0
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Data produksi tidak lengkap."

                    });

            }


            const [result] =
                await pool.query(
                    `
                    INSERT INTO production
                    (
                        production_date,
                        ingredient,
                        stock_weight,
                        estimated_portion,
                        notes
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        date,

                        ingredient.trim(),

                        Number(
                            stockWeight
                        ),

                        Number(
                            estimatedPortion
                        ),

                        notes
                            ?
                            notes.trim()
                            :
                            null
                    ]
                );


            res.status(201).json({

                success:
                    true,

                message:
                    "Data produksi berhasil disimpan.",

                productionId:
                    result.insertId

            });

        }

        catch (error) {

            console.error(
                "Create Production Error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Gagal menyimpan data produksi.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   GET WASTE
========================================= */

app.get(
    "/api/waste",
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(
                    `
                    SELECT
                        w.id,

                        DATE_FORMAT(
                            w.waste_date,
                            '%Y-%m-%d'
                        ) AS date,

                        DATE_FORMAT(
                            w.waste_date,
                            '%Y-%m-%dT%H:%i:%s'
                        ) AS createdAt,

                        w.user_id AS userId,
                        w.menu_id AS menuId,
                        w.item_name AS itemName,
                        w.quantity,
                        w.portion_usage AS portionUsage,
                        w.reason,
                        w.notes,

                        u.name AS userName

                    FROM waste w

                    LEFT JOIN users u
                        ON u.id = w.user_id

                    ORDER BY
                        w.waste_date DESC,
                        w.id DESC
                    `
                );


            res.json({

                success: true,

                data:
                    rows.map(
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
                    )

            });

        }

        catch (error) {

            console.error(
                "Get Waste Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal mengambil data waste.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   POST WASTE
========================================= */

app.post(
    "/api/waste",
    async (req, res) => {

        try {

            const {
                userId,
                menuId,
                itemName,
                quantity,
                portionUsage,
                reason,
                notes
            } = req.body;


            if (
                !userId ||
                !itemName ||
                Number(quantity) <= 0 ||
                Number(portionUsage) < 0 ||
                !reason
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Data waste tidak lengkap."

                    });

            }


            const [users] =
                await pool.query(
                    `
                    SELECT id
                    FROM users
                    WHERE id = ?
                    `,
                    [
                        Number(userId)
                    ]
                );


            if (
                users.length === 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "User pencatat waste tidak ditemukan."

                    });

            }


            if (
                menuId !== null &&
                menuId !== undefined &&
                menuId !== ""
            ) {

                const [menus] =
                    await pool.query(
                        `
                        SELECT id
                        FROM menus
                        WHERE id = ?
                        `,
                        [
                            Number(menuId)
                        ]
                    );


                if (
                    menus.length === 0
                ) {

                    return res
                        .status(400)
                        .json({

                            success: false,

                            message:
                                "Menu tidak ditemukan."

                        });

                }

            }


            const [result] =
                await pool.query(
                    `
                    INSERT INTO waste
                    (
                        user_id,
                        menu_id,
                        item_name,
                        quantity,
                        portion_usage,
                        reason,
                        notes,
                        waste_date
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        NOW()
                    )
                    `,
                    [
                        Number(
                            userId
                        ),

                        menuId === null ||
                        menuId === undefined ||
                        menuId === ""
                            ?
                            null
                            :
                            Number(
                                menuId
                            ),

                        String(
                            itemName
                        ).trim(),

                        Number(
                            quantity
                        ),

                        Number(
                            portionUsage
                        ),

                        String(
                            reason
                        ).trim(),

                        notes
                            ?
                            String(
                                notes
                            ).trim()
                            :
                            null
                    ]
                );


            res.status(201).json({

                success: true,

                message:
                    "Waste berhasil dicatat.",

                wasteId:
                    result.insertId

            });

        }

        catch (error) {

            console.error(
                "Create Waste Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal menyimpan data waste.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   GET STOCK OPNAMES
========================================= */

app.get(
    "/api/stock-opnames",
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(
                    `
                    SELECT
                        so.id,

                        DATE_FORMAT(
                            so.opname_date,
                            '%Y-%m-%d'
                        ) AS date,

                        so.system_stock
                            AS expectedStock,

                        so.physical_stock
                            AS physicalStock,

                        so.stock_difference
                            AS difference,

                        CASE

                            WHEN ABS(
                                COALESCE(
                                    so.stock_difference,
                                    0
                                )
                            ) = 0
                                THEN 'NORMAL'

                            WHEN ABS(
                                COALESCE(
                                    so.stock_difference,
                                    0
                                )
                            ) <= 2
                                THEN 'PERLU DIPERIKSA'

                            ELSE 'SELISIH TINGGI'

                        END AS status,

                        so.notes,

                        so.user_id
                            AS createdBy,

                        DATE_FORMAT(
                            so.created_at,
                            '%Y-%m-%dT%H:%i:%s'
                        ) AS createdAt,

                        u.name
                            AS createdByName

                    FROM stock_opnames so

                    LEFT JOIN users u
                        ON u.id = so.user_id

                    ORDER BY
                        so.opname_date DESC,
                        so.id DESC
                    `
                );


            res.json({

                success: true,

                data:
                    rows.map(
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
                                ),

                            createdBy:
                                Number(
                                    item.createdBy
                                )

                        })
                    )

            });

        }

        catch (error) {

            console.error(
                "Get Stock Opname Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal mengambil data stock opname.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   POST STOCK OPNAME
========================================= */

app.post(
    "/api/stock-opnames",
    async (req, res) => {

        try {

            const {
                date,
                expectedStock,
                physicalStock,
                notes,
                createdBy
            } = req.body;


            if (
                !date ||
                physicalStock === undefined ||
                physicalStock === null ||
                !createdBy
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Data stock opname tidak lengkap."

                    });

            }


            const systemStock =
                Number(
                    expectedStock || 0
                );


            const physical =
                Number(
                    physicalStock
                );


            if (
                Number.isNaN(
                    systemStock
                ) ||
                Number.isNaN(
                    physical
                ) ||
                physical < 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Nilai stok tidak valid."

                    });

            }


            const [users] =
                await pool.query(
                    `
                    SELECT
                        id

                    FROM users

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [
                        Number(
                            createdBy
                        )
                    ]
                );


            if (
                users.length === 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "User pencatat tidak ditemukan."

                    });

            }


            /*
             * Hitung ulang di backend.
             * Jadi nilai selisih tidak cuma
             * dipercaya dari frontend.
             */

            const stockDifference =
                systemStock -
                physical;


            const [result] =
                await pool.query(
                    `
                    INSERT INTO stock_opnames
                    (
                        user_id,
                        opname_date,
                        system_stock,
                        physical_stock,
                        stock_difference,
                        notes
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        Number(
                            createdBy
                        ),

                        date,

                        systemStock,

                        physical,

                        stockDifference,

                        notes
                            ?
                            String(
                                notes
                            ).trim()
                            :
                            null
                    ]
                );


            let status =
                "SELISIH TINGGI";


            const absDifference =
                Math.abs(
                    stockDifference
                );


            if (
                absDifference === 0
            ) {

                status =
                    "NORMAL";

            }

            else if (
                absDifference <= 2
            ) {

                status =
                    "PERLU DIPERIKSA";

            }


            res.status(201).json({

                success: true,

                message:
                    "Stock opname berhasil disimpan.",

                stockOpnameId:
                    result.insertId,

                difference:
                    stockDifference,

                status:
                    status

            });

        }

        catch (error) {

            console.error(
                "Create Stock Opname Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal menyimpan stock opname.",

                error:
                    error.message

            });

        }

    }
);

/* =========================================
   GET CLOSINGS
========================================= */

app.get(
    "/api/closings",
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(
                    `
                    SELECT
                        c.id,

                        c.cashier_id
                            AS cashierId,

                        DATE_FORMAT(
                            c.closing_date,
                            '%Y-%m-%d'
                        ) AS date,

                        c.transaction_count
                            AS transactionCount,

                        c.void_count
                            AS voidCount,

                        c.cash_sales
                            AS cashSales,

                        c.non_cash_sales
                            AS nonCashSales,

                        c.system_cash
                            AS systemCash,

                        c.actual_cash
                            AS actualCash,

                        c.cash_difference
                            AS cashDifference,

                        c.status,

                        c.notes,

                        DATE_FORMAT(
                            c.created_at,
                            '%Y-%m-%dT%H:%i:%s'
                        ) AS createdAt,

                        u.name
                            AS cashierName

                    FROM closings c

                    LEFT JOIN users u
                        ON u.id = c.cashier_id

                    ORDER BY
                        c.closing_date DESC,
                        c.id DESC
                    `
                );


            res.json({

                success: true,

                data:
                    rows.map(
                        item => ({

                            ...item,

                            id:
                                Number(
                                    item.id
                                ),

                            cashierId:
                                Number(
                                    item.cashierId
                                ),

                            transactionCount:
                                Number(
                                    item.transactionCount || 0
                                ),

                            voidCount:
                                Number(
                                    item.voidCount || 0
                                ),

                            cashSales:
                                Number(
                                    item.cashSales || 0
                                ),

                            nonCashSales:
                                Number(
                                    item.nonCashSales || 0
                                ),

                            systemCash:
                                Number(
                                    item.systemCash || 0
                                ),

                            actualCash:
                                Number(
                                    item.actualCash || 0
                                ),

                            cashDifference:
                                Number(
                                    item.cashDifference || 0
                                )

                        })
                    )

            });

        }

        catch (error) {

            console.error(
                "Get Closings Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal mengambil data closing.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   POST CLOSING
========================================= */

app.post(
    "/api/closings",
    async (req, res) => {

        try {

            const {
                cashierId,
                date,
                actualCash,
                notes
            } = req.body;


            if (
                !cashierId ||
                !date ||
                actualCash === undefined ||
                actualCash === null
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Data closing tidak lengkap."

                    });

            }


            const physicalCash =
                Number(
                    actualCash
                );


            if (
                Number.isNaN(
                    physicalCash
                ) ||
                physicalCash < 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Kas fisik tidak valid."

                    });

            }


            /*
             * Pastikan user ada.
             */

            const [users] =
                await pool.query(
                    `
                    SELECT
                        id,
                        status

                    FROM users

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [
                        Number(
                            cashierId
                        )
                    ]
                );


            if (
                users.length === 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Kasir tidak ditemukan."

                    });

            }


            /*
             * Cegah closing dua kali
             * untuk kasir dan tanggal sama.
             */

            const [existing] =
                await pool.query(
                    `
                    SELECT id

                    FROM closings

                    WHERE
                        cashier_id = ?
                        AND closing_date = ?

                    LIMIT 1
                    `,
                    [
                        Number(
                            cashierId
                        ),
                        date
                    ]
                );


            if (
                existing.length > 0
            ) {

                return res
                    .status(409)
                    .json({

                        success: false,

                        message:
                            "Closing hari ini sudah dilakukan."

                    });

            }


            /*
             * Hitung transaksi langsung
             * dari MySQL.
             */

            const [summaryRows] =
                await pool.query(
                    `
                    SELECT

                        SUM(
                            CASE
                                WHEN status <> 'VOID'
                                THEN 1
                                ELSE 0
                            END
                        ) AS transaction_count,

                        SUM(
                            CASE
                                WHEN status = 'VOID'
                                THEN 1
                                ELSE 0
                            END
                        ) AS void_count,

                        SUM(
                            CASE
                                WHEN
                                    status <> 'VOID'
                                    AND UPPER(payment_method) = 'TUNAI'
                                THEN total
                                ELSE 0
                            END
                        ) AS cash_sales,

                        SUM(
                            CASE
                                WHEN
                                    status <> 'VOID'
                                    AND UPPER(payment_method) <> 'TUNAI'
                                THEN total
                                ELSE 0
                            END
                        ) AS non_cash_sales

                    FROM transactions

                    WHERE
                        cashier_id = ?
                        AND DATE(transaction_date) = ?
                    `,
                    [
                        Number(
                            cashierId
                        ),
                        date
                    ]
                );


            const summary =
                summaryRows[0] || {};


            const transactionCount =
                Number(
                    summary.transaction_count || 0
                );


            const voidCount =
                Number(
                    summary.void_count || 0
                );


            const cashSales =
                Number(
                    summary.cash_sales || 0
                );


            const nonCashSales =
                Number(
                    summary.non_cash_sales || 0
                );


            /*
             * Prototype:
             * kas awal dianggap Rp0.
             */

            const systemCash =
                cashSales;


            const cashDifference =
                physicalCash -
                systemCash;


            let status =
                "SESUAI";


            if (
                cashDifference < 0
            ) {

                status =
                    "KURANG";

            }

            else if (
                cashDifference > 0
            ) {

                status =
                    "LEBIH";

            }


            const [result] =
                await pool.query(
                    `
                    INSERT INTO closings
                    (
                        cashier_id,
                        closing_date,
                        transaction_count,
                        void_count,
                        cash_sales,
                        non_cash_sales,
                        system_cash,
                        actual_cash,
                        cash_difference,
                        status,
                        notes
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        Number(
                            cashierId
                        ),

                        date,

                        transactionCount,

                        voidCount,

                        cashSales,

                        nonCashSales,

                        systemCash,

                        physicalCash,

                        cashDifference,

                        status,

                        notes
                            ?
                            String(
                                notes
                            ).trim()
                            :
                            null
                    ]
                );


            res.status(201).json({

                success: true,

                message:
                    "Closing berhasil disimpan.",

                closingId:
                    result.insertId,

                data: {

                    transactionCount:
                        transactionCount,

                    voidCount:
                        voidCount,

                    cashSales:
                        cashSales,

                    nonCashSales:
                        nonCashSales,

                    systemCash:
                        systemCash,

                    actualCash:
                        physicalCash,

                    cashDifference:
                        cashDifference,

                    status:
                        status

                }

            });

        }

        catch (error) {

            console.error(
                "Create Closing Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal menyimpan closing.",

                error:
                    error.message

            });

        }

    }
);

/* =========================================
   GET AUDIT LOGS
========================================= */

app.get(
    "/api/audit-logs",
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(
                    `
                    SELECT
                        a.id,

                        a.user_id
                            AS userId,

                        a.action,

                        a.description,

                        DATE_FORMAT(
                            a.created_at,
                            '%Y-%m-%dT%H:%i:%s'
                        ) AS createdAt,

                        u.name
                            AS userName,

                        u.role
                            AS userRole

                    FROM audit_logs a

                    LEFT JOIN users u
                        ON u.id = a.user_id

                    ORDER BY
                        a.created_at DESC,
                        a.id DESC
                    `
                );


            res.json({

                success: true,

                data:
                    rows.map(
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
                    )

            });

        }

        catch (error) {

            console.error(
                "Get Audit Logs Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal mengambil audit log.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   POST AUDIT LOG
========================================= */

app.post(
    "/api/audit-logs",
    async (req, res) => {

        try {

            const {
                userId,
                action,
                description
            } = req.body;


            if (
                !userId ||
                !action
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "User dan aktivitas wajib diisi."

                    });

            }


            const [users] =
                await pool.query(
                    `
                    SELECT id

                    FROM users

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [
                        Number(
                            userId
                        )
                    ]
                );


            if (
                users.length === 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "User audit tidak ditemukan."

                    });

            }


            const [result] =
                await pool.query(
                    `
                    INSERT INTO audit_logs
                    (
                        user_id,
                        action,
                        description
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        Number(
                            userId
                        ),

                        String(
                            action
                        )
                            .trim()
                            .toUpperCase(),

                        description
                            ?
                            String(
                                description
                            ).trim()
                            :
                            null
                    ]
                );


            res.status(201).json({

                success: true,

                message:
                    "Audit log berhasil disimpan.",

                auditLogId:
                    result.insertId

            });

        }

        catch (error) {

            console.error(
                "Create Audit Log Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal menyimpan audit log.",

                error:
                    error.message

            });

        }

    }
);

/* =========================================
   IOT VALIDATION
========================================= */
/* =========================================
   CREATE PENDING VALIDATION
========================================= */

app.post(
    "/api/iot-validations/:transactionId/create",
    async (req, res) => {

        try {

            const transactionId =
                Number(
                    req.params.transactionId
                );


            if (
                !transactionId
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "ID transaksi tidak valid."

                    });

            }


            const [transactions] =
                await pool.query(
                    `
                    SELECT

                        t.id,

                        t.transaction_code,

                        t.status,

                        t.order_type,

                        COALESCE(
                            SUM(
                                ti.quantity
                            ),
                            0
                        ) AS expected_count

                    FROM transactions t

                    LEFT JOIN transaction_items ti
                        ON ti.transaction_id = t.id

                    WHERE t.id = ?

                    GROUP BY
                        t.id,
                        t.transaction_code,
                        t.status,
                        t.order_type

                    LIMIT 1
                    `,
                    [
                        transactionId
                    ]
                );


            if (
                transactions.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Transaksi tidak ditemukan."

                    });

            }


            const transaction =
                transactions[0];


            if (
                transaction.status ===
                "VOID"
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Transaksi VOID tidak dapat divalidasi."

                    });

            }


            const expectedCount =
                Number(
                    transaction.expected_count || 0
                );


            const validationStation =
                transaction.order_type ||
                "TAKEAWAY";


            if (
                expectedCount <= 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Transaksi tidak memiliki item untuk divalidasi."

                    });

            }


            const [existing] =
                await pool.query(
                    `
                    SELECT

                        id,

                        transaction_id
                            AS transactionId,

                        validation_station
                            AS validationStation,

                        expected_count
                            AS expectedCount,

                        detected_count
                            AS detectedCount,

                        average_confidence
                            AS averageConfidence,

                        status,

                        image_path
                            AS imagePath,

                        notes,

                        created_at
                            AS createdAt

                    FROM iot_validations

                    WHERE
                        transaction_id = ?
                        AND status = 'PENDING'

                    ORDER BY id DESC

                    LIMIT 1
                    `,
                    [
                        transactionId
                    ]
                );


            if (
                existing.length > 0
            ) {

                return res.json({

                    success: true,

                    message:
                        "Validasi IoT masih menunggu proses.",

                    data:
                        existing[0]

                });

            }


            const [result] =
                await pool.query(
                    `
                    INSERT INTO iot_validations
                    (
                        transaction_id,
                        validation_station,
                        expected_count,
                        status
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        'PENDING'
                    )
                    `,
                    [

                        transactionId,

                        validationStation,

                        expectedCount

                    ]
                );


            res.status(201).json({

                success: true,

                message:
                    "Validasi IoT dibuat.",

                data: {

                    id:
                        result.insertId,

                    transactionId:
                        transactionId,

                    transactionCode:
                        transaction.transaction_code,

                    validationStation:
                        validationStation,

                    expectedCount:
                        expectedCount,

                    detectedCount:
                        null,

                    status:
                        "PENDING"

                }

            });

        }

        catch (error) {

            console.error(
                "Create IoT Validation Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal membuat validasi IoT.",

                error:
                    error.message

            });

        }

    }
);

/* =========================================
   GET PENDING VALIDATIONS
========================================= */

app.get(
    "/api/iot-validations/pending",
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(
                    `
                    SELECT

                        iv.id,

                        iv.transaction_id
                            AS transactionId,

                    t.transaction_code
    AS transactionCode,

iv.validation_station
    AS validationStation,

iv.expected_count
                            AS expectedCount,

                        iv.detected_count
                            AS detectedCount,

                        iv.average_confidence
                            AS averageConfidence,

                        iv.status,

                        iv.image_path
                            AS imagePath,

                        iv.notes,

                        iv.created_at
                            AS createdAt

                    FROM iot_validations iv

                    JOIN transactions t
                        ON t.id =
                           iv.transaction_id

                    WHERE
                        iv.status = 'PENDING'

                    ORDER BY
                        iv.id ASC
                    `
                );


            res.json({

                success: true,

                data:
                    rows.map(
                        item => ({

                            ...item,

                            id:
                                Number(
                                    item.id
                                ),

                            transactionId:
                                Number(
                                    item.transactionId
                                ),

                            expectedCount:
                                Number(
                                    item.expectedCount || 0
                                ),

                            detectedCount:
                                item.detectedCount === null
                                    ? null
                                    : Number(
                                        item.detectedCount
                                    ),

                            averageConfidence:
                                item.averageConfidence === null
                                    ? null
                                    : Number(
                                        item.averageConfidence
                                    )

                        })
                    )

            });

        }

        catch (error) {

            console.error(
                "Get Pending IoT Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal mengambil validasi IoT.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   SAVE DETECTION RESULT
========================================= */

app.post(
    "/api/iot-validations/:id/result",
    async (req, res) => {

        try {

            const validationId =
                Number(
                    req.params.id
                );


            const {

                detectedCount,

                averageConfidence,

                imagePath,

                notes

            } = req.body;


            if (
                !validationId
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "ID validasi tidak valid."

                    });

            }


            const detected =
                Number(
                    detectedCount
                );


            if (
                Number.isNaN(
                    detected
                ) ||
                detected < 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Jumlah hasil deteksi tidak valid."

                    });

            }


            let confidence =
                null;


            if (
                averageConfidence !==
                undefined

                &&

                averageConfidence !==
                null
            ) {

                confidence =
                    Number(
                        averageConfidence
                    );


                if (
                    Number.isNaN(
                        confidence
                    ) ||
                    confidence < 0 ||
                    confidence > 1
                ) {

                    return res
                        .status(400)
                        .json({

                            success: false,

                            message:
                                "Confidence harus antara 0 sampai 1."

                        });

                }

            }


            const [validations] =
                await pool.query(
                    `
                    SELECT

                        id,

                        transaction_id,

                        expected_count,

                        status

                    FROM iot_validations

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [
                        validationId
                    ]
                );


            if (
                validations.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Data validasi tidak ditemukan."

                    });

            }


            const validation =
                validations[0];


            const expectedCount =
                Number(
                    validation.expected_count || 0
                );


            const validationStatus =
                detected === expectedCount

                    ?

                    "MATCH"

                    :

                    "MISMATCH";


            await pool.query(
                `
                UPDATE iot_validations

                SET

                    detected_count = ?,

                    average_confidence = ?,

                    status = ?,

                    image_path = ?,

                    notes = ?,

                    validated_at = NOW()

                WHERE id = ?
                `,
                [

                    detected,

                    confidence,

                    validationStatus,

                    imagePath
                        ?
                        String(
                            imagePath
                        ).trim()
                        :
                        null,

                    notes
                        ?
                        String(
                            notes
                        ).trim()
                        :
                        null,

                    validationId

                ]
            );


            res.json({

                success: true,

                message:
                    validationStatus ===
                    "MATCH"

                        ?

                        "Jumlah kemasan sesuai dengan pesanan."

                        :

                        "Jumlah kemasan tidak sesuai dengan pesanan.",

                data: {

                    id:
                        validationId,

                    transactionId:
                        Number(
                            validation.transaction_id
                        ),

                    expectedCount:
                        expectedCount,

                    detectedCount:
                        detected,

                    averageConfidence:
                        confidence,

                    status:
                        validationStatus

                }

            });

        }

        catch (error) {

            console.error(
                "IoT Result Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal menyimpan hasil deteksi IoT.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   GET ALL IOT VALIDATIONS
========================================= */

app.get(
    "/api/iot-validations",
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(
                    `
                    SELECT

                        iv.id,

                        iv.transaction_id
                            AS transactionId,

t.transaction_code
    AS transactionCode,

iv.validation_station
    AS validationStation,

iv.expected_count
                            AS expectedCount,

                        iv.detected_count
                            AS detectedCount,

                        iv.average_confidence
                            AS averageConfidence,

                        iv.status,

                        iv.image_path
                            AS imagePath,

                        iv.notes,

                        iv.validated_at
                            AS validatedAt,

                        iv.created_at
                            AS createdAt

                    FROM iot_validations iv

                    JOIN transactions t
                        ON t.id =
                           iv.transaction_id

                    ORDER BY
                        iv.id DESC
                    `
                );


            res.json({

                success: true,

                data:
                    rows

            });

        }

        catch (error) {

            console.error(
                "Get IoT Validations Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Gagal mengambil riwayat validasi IoT.",

                error:
                    error.message

            });

        }

    }
);

/* =========================================
   SERVER
========================================= */

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    async () => {

        console.log(
            `SmartPOS API running on http://localhost:${PORT}`
        );

        await testConnection();

    }
);