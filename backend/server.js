const express = require("express");
const cors = require("cors");

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
// =====================================================
// POST TRANSACTION
// =====================================================
app.post("/api/transactions", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            transactionCode,
            cashierId,
            paymentMethod,
            total,
            items
        } = req.body;

        // Validasi dasar
        if (
            !transactionCode ||
            !cashierId ||
            !paymentMethod ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Data transaksi tidak lengkap"
            });
        }

        await connection.beginTransaction();

        // 1. Simpan transaksi utama
        const [transactionResult] = await connection.query(
            `
            INSERT INTO transactions
            (
                transaction_code,
                cashier_id,
                transaction_date,
                payment_method,
                total,
                status
            )
            VALUES (?, ?, NOW(), ?, ?, 'SUCCESS')
            `,
            [
                transactionCode,
                cashierId,
                paymentMethod,
                total
            ]
        );

        const transactionId = transactionResult.insertId;

        // 2. Simpan setiap item transaksi
        for (const item of items) {
            const subtotal =
                Number(item.price) * Number(item.quantity);

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
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    transactionId,
                    item.menuId,
                    item.quantity,
                    item.price,
                    item.portionUsage || 0,
                    subtotal
                ]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Transaksi berhasil disimpan",
            transactionId,
            transactionCode
        });

    } catch (error) {
        await connection.rollback();

        console.error("❌ Transaction Error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal menyimpan transaksi",
            error: error.message
        });

    } finally {
        connection.release();
    }
});



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