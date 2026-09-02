import os
import time
import re
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
    description=(
        "Adaptive campus exploration powered by "
        "Databricks SQL and Databricks Genie"
    ),
    version="4.0.0",
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

GENIE_SPACE_ID = (
    "01f1a6efb5fc15db961a3a6f330fbec9"
)


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
            detail=(
                "Databricks environment variables "
                "are not configured"
            ),
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
        "Authorization": (
            f"Bearer {DATABRICKS_TOKEN}"
        ),
        "Content-Type": "application/json",
    }


# ===================================================
# DIFFICULTY ENGINE
# ===================================================

def calculate_difficulty(wrong_attempts):

    if wrong_attempts >= 3:

        return (
            "Easy",
            (
                "The player is struggling, so the "
                "AI Game Master selected an easier "
                "challenge."
            ),
        )

    elif wrong_attempts >= 1:

        return (
            "Medium",
            (
                "The player needs a moderate "
                "challenge based on recent attempts."
            ),
        )

    return (
        "Hard",
        (
            "The player is performing well, so the "
            "AI Game Master selected a harder "
            "challenge."
        ),
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
        "host_configured": bool(
            DATABRICKS_HOST
        ),
        "http_path_configured": bool(
            DATABRICKS_HTTP_PATH
        ),
        "token_configured": bool(
            DATABRICKS_TOKEN
        ),
        "token_prefix": (
            DATABRICKS_TOKEN[:8]
            if DATABRICKS_TOKEN
            else None
        ),
    }


# ===================================================
# HEALTH CHECK
# ===================================================

@app.get("/health")
def health():

    try:

        connection = (
            get_databricks_connection()
        )

        cursor = connection.cursor()

        cursor.execute(
            "SELECT 1"
        )

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

        connection = (
            get_databricks_connection()
        )

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
# GET NORMAL DATABRICKS MISSION
# ===================================================

@app.get("/mission")
def get_mission(
    campus_name: str = "BMSCE",
    experience: str = "freshman",
    difficulty: str = "Hard",
):

    try:

        connection = (
            get_databricks_connection()
        )

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

        mission = dict(
            zip(columns, row)
        )

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

    difficulty, reason = (
        calculate_difficulty(
            wrong_attempts
        )
    )

    try:

        connection = (
            get_databricks_connection()
        )

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
                    f"No {difficulty} mission "
                    f"found for {campus_name}"
                ),
            )

        columns = [
            column[0]
            for column in cursor.description
        ]

        mission = dict(
            zip(columns, row)
        )

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
# PARSE GENIE RESPONSE
# ===================================================

def extract_genie_mission(
    genie_text,
    campus_name,
    experience,
    difficulty,
):

    """
    Genie may return a natural-language answer instead
    of JSON. We extract the required mission fields.
    """

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

    text = genie_text.strip()

    # LOCATION

    location_match = re.search(
        r"(?:location_name|Location)"
        r"\s*[:\-]?\s*\**([^*\n.]+)",
        text,
        re.IGNORECASE,
    )

    if location_match:

        mission["location_name"] = (
            location_match
            .group(1)
            .strip()
            .replace("**", "")
        )

    else:

        location_match = re.search(
            r"(?:at|is at)\s+\**([^*.,]+)",
            text,
            re.IGNORECASE,
        )

        if location_match:

            mission["location_name"] = (
                location_match
                .group(1)
                .strip()
            )


    # PUZZLE

    puzzle_match = re.search(
        r"(?:puzzle is|puzzle:)"
        r"\s*[\"“]?(.+?)[\"”]"
        r"(?:\.|\s)",
        text,
        re.IGNORECASE,
    )

    if puzzle_match:

        mission["puzzle"] = (
            puzzle_match
            .group(1)
            .strip()
        )


    # CORRECT ANSWER

    answer_match = re.search(
        r"(?:correct answer(?: is|:))"
        r"\s*\**([^*.,]+)",
        text,
        re.IGNORECASE,
    )

    if answer_match:

        mission["correct_answer"] = (
            answer_match
            .group(1)
            .strip()
        )


    # DESCRIPTION

    description_match = re.search(
        r"(?:description(?: is|:))"
        r"\s*[\"“]?(.+?)[\"”]"
        r"(?:,|\.)",
        text,
        re.IGNORECASE,
    )

    if description_match:

        mission["description"] = (
            description_match
            .group(1)
            .strip()
        )


    # HINT 1

    hint1_match = re.search(
        r"(?:hint_1|hint 1)"
        r"\s*[:\-]?\s*[\"“]?(.+?)[\"”]"
        r"(?:,|\.)",
        text,
        re.IGNORECASE,
    )

    if hint1_match:

        mission["hint_1"] = (
            hint1_match
            .group(1)
            .strip()
        )


    # HINT 2

    hint2_match = re.search(
        r"(?:hint_2|hint 2)"
        r"\s*[:\-]?\s*[\"“]?(.+?)[\"”]"
        r"(?:,|\.)",
        text,
        re.IGNORECASE,
    )

    if hint2_match:

        mission["hint_2"] = (
            hint2_match
            .group(1)
            .strip()
        )


    # XP

    xp_match = re.search(
        r"(?:XP reward(?: is|:)?|reward is)"
        r"\s*\**(\d+)",
        text,
        re.IGNORECASE,
    )

    if xp_match:

        mission["xp_reward"] = int(
            xp_match.group(1)
        )


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

    difficulty, reason = (
        calculate_difficulty(
            wrong_attempts
        )
    )

    prompt = f"""
You are the Campus Cryptic AI Game Master.

Use the campus_nodes table available in this Genie
Space.

Select exactly ONE mission.

Campus name: {campus_name}
Experience type: {experience}
Difficulty: {difficulty}

The player currently has
{wrong_attempts} wrong attempts.

Return the answer in this EXACT format:

location_name: <location>
description: <description>
puzzle: <puzzle>
correct_answer: <answer>
difficulty: <difficulty>
hint_1: <first hint>
hint_2: <second hint>
xp_reward: <number>

Do not add any introduction.
Do not add explanations.
Do not add markdown.
Return only these eight fields.
"""


    try:

        # ===========================================
        # START GENIE CONVERSATION
        # ===========================================

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
                detail=(
                    "Genie start error: "
                    f"{response.text}"
                ),
            )


        start_data = response.json()

        conversation_id = (
            start_data.get(
                "conversation_id"
            )
        )


        if not conversation_id:

            raise HTTPException(
                status_code=500,
                detail=(
                    "No conversation ID returned "
                    f"from Genie: {start_data}"
                ),
            )


        # ===========================================
        # GET CONVERSATION RESULT
        # ===========================================

        message_url = (
            f"{GENIE_BASE_URL}"
            f"/conversations/"
            f"{conversation_id}"
            f"/messages"
        )


        # ===========================================
        # POLL GENIE
        # ===========================================

        for _ in range(30):

            time.sleep(2)

            result_response = requests.get(
                message_url,
                headers=get_genie_headers(),
                timeout=30,
            )


            if result_response.status_code >= 400:

                raise HTTPException(
                    status_code=(
                        result_response.status_code
                    ),
                    detail=(
                        "Genie result error: "
                        f"{result_response.text}"
                    ),
                )


            result_data = (
                result_response.json()
            )


            messages = result_data.get(
                "messages",
                (
                    result_data
                    if isinstance(
                        result_data,
                        list,
                    )
                    else []
                ),
            )


            genie_answer = None


            # =======================================
            # FIND COMPLETED GENIE RESPONSE
            # =======================================

            for message in reversed(messages):

                attachments = (
                    message.get(
                        "attachments",
                        [],
                    )
                )

                for attachment in attachments:

                    if "text" in attachment:

                        content = (
                            attachment["text"]
                            .get("content")
                        )

                        if content:

                            genie_answer = content
                            break


                if genie_answer:
                    break


            # =======================================
            # GENIE RESPONSE FOUND
            # =======================================

            if genie_answer:

                mission = (
                    extract_genie_mission(
                        genie_answer,
                        campus_name,
                        experience,
                        difficulty,
                    )
                )


                # ===================================
                # FALLBACK IF PARSING IS INCOMPLETE
                # ===================================

                if (
                    not mission["location_name"]
                    or not mission["puzzle"]
                    or not mission["correct_answer"]
                ):

                    connection = (
                        get_databricks_connection()
                    )

                    cursor = (
                        connection.cursor()
                    )

                    cursor.execute(
                        """
                        SELECT *
                        FROM workspace.default.campus_nodes
                        WHERE LOWER(campus_name)
                            = LOWER(?)
                          AND LOWER(experience)
                            = LOWER(?)
                          AND LOWER(difficulty)
                            = LOWER(?)
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

                    columns = [
                        column[0]
                        for column
                        in cursor.description
                    ]

                    cursor.close()
                    connection.close()


                    if row:

                        mission = dict(
                            zip(
                                columns,
                                row,
                            )
                        )


                return {
                    "source": (
                        "Databricks Genie"
                    ),
                    "recommended_difficulty": (
                        difficulty
                    ),
                    "reason": reason,
                    "wrong_attempts": (
                        wrong_attempts
                    ),
                    "conversation_id": (
                        conversation_id
                    ),
                    "mission": mission,
                    "genie_raw_response": (
                        genie_answer
                    ),
                }


        # ===========================================
        # GENIE TIMEOUT
        # ===========================================

        raise HTTPException(
            status_code=504,
            detail=(
                "Genie response timed out"
            ),
        )


    except HTTPException:
        raise


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Genie error: "
                f"{str(error)}"
            ),
        )