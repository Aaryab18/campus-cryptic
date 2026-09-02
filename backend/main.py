import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from databricks import sql


app = FastAPI(
    title="Campus Cryptic API",
    description="Adaptive campus exploration powered by Databricks",
    version="2.0.0",
)


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://campus-cryptic-ten.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Databricks configuration from Render environment variables
DATABRICKS_HOST = os.getenv("DATABRICKS_HOST")
DATABRICKS_HTTP_PATH = os.getenv("DATABRICKS_HTTP_PATH")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN")


def get_databricks_connection():
    if not all(
        [
            DATABRICKS_HOST,
            DATABRICKS_HTTP_PATH,
            DATABRICKS_TOKEN,
        ]
    ):
        raise HTTPException(
            status_code=500,
            detail="Databricks environment variables are not configured",
        )

    # Remove https:// because the connector expects only the hostname
    server_hostname = DATABRICKS_HOST.replace(
        "https://", ""
    ).replace(
        "http://", ""
    ).rstrip("/")

    return sql.connect(
        server_hostname=server_hostname,
        http_path=DATABRICKS_HTTP_PATH,
        access_token=DATABRICKS_TOKEN,
    )


@app.get("/")
def root():
    return {
        "message": "Campus Cryptic API is running",
        "status": "online",
        "databricks": "connected",
    }


@app.get("/health")
def health():
    try:
        connection = get_databricks_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT 1")
        result = cursor.fetchone()

        cursor.close()
        connection.close()

        return {
            "status": "online",
            "databricks": "connected",
            "test": result[0],
        }

    except Exception as error:
        return {
            "status": "online",
            "databricks": "error",
            "message": str(error),
        }


@app.get("/missions")
def get_missions():
    try:
        connection = get_databricks_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT *
            FROM workspace.default.campus_nodes
            ORDER BY node_id
        """)

        columns = [column[0] for column in cursor.description]

        missions = [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]

        cursor.close()
        connection.close()

        return {
            "count": len(missions),
            "missions": missions,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@app.get("/mission")
def get_adaptive_mission(
    campus_name: str = "BMSCE",
    experience: str = "freshman",
    difficulty: str = "Hard",
):
    try:
        connection = get_databricks_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT *
            FROM workspace.default.campus_nodes
            WHERE LOWER(campus_name) = LOWER(?)
              AND LOWER(experience) = LOWER(?)
              AND LOWER(difficulty) = LOWER(?)
            ORDER BY node_id
            LIMIT 1
            """,
            (
                campus_name,
                experience,
                difficulty,
            ),
        )

        row = cursor.fetchone()

        if not row:
            cursor.close()
            connection.close()

            raise HTTPException(
                status_code=404,
                detail=(
                    f"No mission found for "
                    f"{campus_name}, "
                    f"{experience}, "
                    f"{difficulty}"
                ),
            )

        columns = [
            column[0]
            for column in cursor.description
        ]

        mission = dict(zip(columns, row))

        cursor.close()
        connection.close()

        return {
            "mission": mission,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@app.get("/adaptive-mission")
def get_adaptive_mission_by_attempts(
    campus_name: str = "BMSCE",
    experience: str = "freshman",
    wrong_attempts: int = 0,
):
    # Adaptive difficulty logic
    if wrong_attempts >= 3:
        difficulty = "Easy"
        reason = (
            "Player is struggling. "
            "Switching to an easier mission."
        )

    elif wrong_attempts >= 1:
        difficulty = "Medium"
        reason = (
            "Player needs a moderate challenge."
        )

    else:
        difficulty = "Hard"
        reason = (
            "Player is performing well. "
            "Increasing challenge."
        )

    try:
        connection = get_databricks_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT *
            FROM workspace.default.campus_nodes
            WHERE LOWER(campus_name) = LOWER(?)
              AND LOWER(experience) = LOWER(?)
              AND LOWER(difficulty) = LOWER(?)
            ORDER BY node_id
            LIMIT 1
            """,
            (
                campus_name,
                experience,
                difficulty,
            ),
        )

        row = cursor.fetchone()

        if not row:
            cursor.close()
            connection.close()

            raise HTTPException(
                status_code=404,
                detail=(
                    f"No {difficulty} mission found "
                    f"for {campus_name}"
                ),
            )

        columns = [
            column[0]
            for column in cursor.description
        ]

        mission = dict(zip(columns, row))

        cursor.close()
        connection.close()

        return {
            "recommended_difficulty": difficulty,
            "reason": reason,
            "mission": mission,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )