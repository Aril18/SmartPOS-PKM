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