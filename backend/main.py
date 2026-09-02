import os
import time
import requests

from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from databricks import sql


# ===================================================
# LOAD ENVIRONMENT VARIABLES
# ===================================================

load_dotenv(
    Path(__file__).resolve().parent / ".env"
)


# ===================================================
# FASTAPI APP
# ===================================================

app = FastAPI(
    title="Campus Cryptic API",
    description="Adaptive campus exploration powered by Databricks SQL and Databricks Genie",
    version="5.0.0",
)


# ===================================================
# CORS
# ===================================================

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


# ===================================================
# DATABRICKS CONFIGURATION
# ===================================================

DATABRICKS_HOST = os.getenv("DATABRICKS_HOST")
DATABRICKS_HTTP_PATH = os.getenv("DATABRICKS_HTTP_PATH")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN")

GENIE_SPACE_ID = "01f1a6efb5fc15db961a3a6f330fbec9"


# ===================================================
# DATABRICKS HELPERS
# ===================================================

def get_databricks_hostname():

    if not DATABRICKS_HOST:
        raise HTTPException(
            status_code=500,
            detail="DATABRICKS_HOST is not configured",
        )

    return (
        DATABRICKS_HOST
        .replace("https://", "")
        .replace("http://", "")
        .rstrip("/")
    )


def get_databricks_connection():

    if not all([
        DATABRICKS_HOST,
        DATABRICKS_HTTP_PATH,
        DATABRICKS_TOKEN,
    ]):
        raise HTTPException(
            status_code=500,
            detail="Databricks environment variables are not configured",
        )

    return sql.connect(
        server_hostname=get_databricks_hostname(),
        http_path=DATABRICKS_HTTP_PATH,
        access_token=DATABRICKS_TOKEN,
    )


# ===================================================
# GENIE CONFIGURATION
# ===================================================

GENIE_BASE_URL = (
    f"https://{get_databricks_hostname()}"
    f"/api/2.0/genie/spaces/{GENIE_SPACE_ID}"
)

GENIE_START_URL = (
    f"{GENIE_BASE_URL}/start-conversation"
)


def get_genie_headers():

    if not DATABRICKS_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="DATABRICKS_TOKEN is not configured",
        )

    return {
        "Authorization": f"Bearer {DATABRICKS_TOKEN}",
        "Content-Type": "application/json",
    }


# ===================================================
# DIFFICULTY ENGINE
# ===================================================

def calculate_difficulty(wrong_attempts: int):

    if wrong_attempts >= 3:
        return (
            "Easy",
            "The player is struggling, so the AI Game Master selected an easier challenge."
        )

    elif wrong_attempts >= 1:
        return (
            "Medium",
            "The player made incorrect attempts, so the AI Game Master selected a moderate challenge."
        )

    return (
        "Hard",
        "The player is performing well, so the AI Game Master selected a harder challenge."
    )


# ===================================================
# ROOT
# ===================================================

@app.get("/")
def root():

    return {
        "message": "Campus Cryptic API is running",
        "status": "online",
        "databricks": "connected",
        "genie": "configured",
    }


# ===================================================
# DEBUG ENVIRONMENT
# ===================================================

@app.get("/debug-env")
def debug_env():

    return {
        "host_configured": bool(DATABRICKS_HOST),
        "http_path_configured": bool(DATABRICKS_HTTP_PATH),
        "token_configured": bool(DATABRICKS_TOKEN),
    }


# ===================================================
# HEALTH CHECK
# ===================================================

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
            "genie_space_id": GENIE_SPACE_ID,
        }

    except Exception as error:

        return {
            "status": "online",
            "databricks": "error",
            "message": str(error),
        }


# ===================================================
# GET ALL MISSIONS
# ===================================================

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

        columns = [
            column[0]
            for column in cursor.description
        ]

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


# ===================================================
# GET NORMAL MISSION
# ===================================================

@app.get("/mission")
def get_mission(

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
            ORDER BY RAND()
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


# ===================================================
# NORMAL ADAPTIVE MISSION
# DATABRICKS SQL FALLBACK
# ===================================================

@app.get("/adaptive-mission")
def adaptive_mission(

    campus_name: str = "BMSCE",
    experience: str = "freshman",
    wrong_attempts: int = 0,

):

    difficulty, reason = calculate_difficulty(
        wrong_attempts
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
            ORDER BY RAND()
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
                detail=f"No {difficulty} mission found for {campus_name}",
            )

        columns = [
            column[0]
            for column in cursor.description
        ]

        mission = dict(zip(columns, row))

        cursor.close()
        connection.close()

        return {
            "source": "Databricks SQL",
            "recommended_difficulty": difficulty,
            "reason": reason,
            "wrong_attempts": wrong_attempts,
            "mission": mission,
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ===================================================
# SIMPLE GENIE RESPONSE PARSER
# ===================================================

def parse_genie_mission(
    genie_text: str,
    campus_name: str,
    experience: str,
    difficulty: str,
):

    mission = {
        "node_id": 0,
        "campus_name": campus_name,
        "experience": experience,
        "location_name": "",
        "description": "",
        "puzzle": "",
        "correct_answer": "",
        "difficulty": difficulty,
        "hint_1": "",
        "hint_2": "",
        "xp_reward": 0,
    }

    if not genie_text:
        return mission

    # Normalize text
    lines = genie_text.strip().splitlines()

    for line in lines:

        line = line.strip()

        if not line:
            continue

        if ":" not in line:
            continue

        key, value = line.split(":", 1)

        key = key.strip().lower()
        value = value.strip()

        # Remove markdown formatting if Genie adds it
        value = (
            value
            .replace("**", "")
            .replace("*", "")
            .strip()
        )

        if key == "location_name":
            mission["location_name"] = value

        elif key == "description":
            mission["description"] = value

        elif key == "puzzle":
            mission["puzzle"] = value

        elif key == "correct_answer":
            mission["correct_answer"] = value

        elif key == "difficulty":

            normalized_difficulty = value.capitalize()

            if normalized_difficulty in [
                "Easy",
                "Medium",
                "Hard",
            ]:
                mission["difficulty"] = normalized_difficulty

        elif key == "hint_1":
            mission["hint_1"] = value

        elif key == "hint_2":
            mission["hint_2"] = value

        elif key == "xp_reward":

            try:
                mission["xp_reward"] = int(value)
            except ValueError:
                mission["xp_reward"] = 0

    return mission


# ===================================================
# GENIE-POWERED ADAPTIVE MISSION
# ===================================================

@app.get("/genie-mission")
def genie_mission(

    campus_name: str = "BMSCE",
    experience: str = "freshman",
    wrong_attempts: int = 0,

):

    # -----------------------------------------------
    # CALCULATE DIFFICULTY
    # -----------------------------------------------

    difficulty, reason = calculate_difficulty(
        wrong_attempts
    )


    # -----------------------------------------------
    # GENIE PROMPT
    # -----------------------------------------------

    prompt = f"""
You are the Campus Cryptic AI Game Master.

Select exactly ONE mission from the campus_nodes data available to you.

Requirements:

Campus: {campus_name}
Experience: {experience}
Difficulty: {difficulty}
Wrong attempts: {wrong_attempts}

Return EXACTLY these 8 lines.

location_name: value
description: value
puzzle: value
correct_answer: value
difficulty: {difficulty}
hint_1: value
hint_2: value
xp_reward: number

Rules:
- Do not use JSON.
- Do not use markdown.
- Do not use bullet points.
- Do not add explanations.
- Do not add extra text.
- Every field must contain a value.
- Select only a real mission from campus_nodes data.
"""


    try:

        # -------------------------------------------
        # START GENIE CONVERSATION
        # -------------------------------------------

        response = requests.post(
            GENIE_START_URL,
            headers=get_genie_headers(),
            json={
                "content": prompt,
            },
            timeout=30,
        )

        if response.status_code >= 400:

            raise HTTPException(
                status_code=response.status_code,
                detail=f"Genie start error: {response.text}",
            )


        start_data = response.json()

        conversation_id = start_data.get(
            "conversation_id"
        )


        if not conversation_id:

            raise HTTPException(
                status_code=500,
                detail=(
                    "No conversation ID returned from Genie: "
                    f"{start_data}"
                ),
            )


        # -------------------------------------------
        # GENIE MESSAGE URL
        # -------------------------------------------

        message_url = (
            f"{GENIE_BASE_URL}"
            f"/conversations/{conversation_id}/messages"
        )


        # -------------------------------------------
        # POLL GENIE
        # -------------------------------------------

        for _ in range(30):

            time.sleep(2)

            result_response = requests.get(
                message_url,
                headers=get_genie_headers(),
                timeout=30,
            )


            if result_response.status_code >= 400:

                raise HTTPException(
                    status_code=result_response.status_code,
                    detail=(
                        "Genie result error: "
                        f"{result_response.text}"
                    ),
                )


            result_data = result_response.json()


            messages = result_data.get(
                "messages",
                result_data
                if isinstance(result_data, list)
                else [],
            )


            genie_answer = None


            # ---------------------------------------
            # FIND GENIE TEXT RESPONSE
            # ---------------------------------------

            for message in reversed(messages):

                attachments = message.get(
                    "attachments",
                    [],
                )

                for attachment in attachments:

                    if "text" in attachment:

                        text_data = attachment.get(
                            "text",
                            {},
                        )

                        content = text_data.get(
                            "content"
                        )

                        if content:

                            genie_answer = content
                            break

                if genie_answer:
                    break


            # ---------------------------------------
            # PARSE AND RETURN MISSION
            # ---------------------------------------

            if genie_answer:

                mission = parse_genie_mission(
                    genie_answer,
                    campus_name,
                    experience,
                    difficulty,
                )


                # Validate Genie result
                required_fields = [
                    "location_name",
                    "description",
                    "puzzle",
                    "correct_answer",
                    "hint_1",
                    "hint_2",
                ]

                missing_fields = [
                    field
                    for field in required_fields
                    if not mission.get(field)
                ]


                if missing_fields:

                    raise HTTPException(
                        status_code=500,
                        detail={
                            "message": "Genie returned incomplete mission",
                            "missing_fields": missing_fields,
                            "raw_response": genie_answer,
                        },
                    )


                return {
                    "source": "Databricks Genie",
                    "recommended_difficulty": difficulty,
                    "reason": reason,
                    "wrong_attempts": wrong_attempts,
                    "conversation_id": conversation_id,
                    "mission": mission,
                    "genie_raw_response": genie_answer,
                }


        # -------------------------------------------
        # TIMEOUT
        # -------------------------------------------

        raise HTTPException(
            status_code=504,
            detail="Genie response timed out",
        )


    except HTTPException:
        raise


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Genie error: {str(error)}",
        )