from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Campus Cryptic API",
    description="Backend API for the Campus Cryptic adaptive campus exploration game",
    version="1.0.0",
)

# Allow the Next.js frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary in-memory mission data
# Later this can be replaced by Databricks Delta Tables.
missions = [
    {
        "id": 1,
        "experience": "freshman",
        "title": "The House of Knowledge",
        "location": "RVCE Central Library",
        "difficulty": "Easy",
        "xp": 50,
    },
    {
        "id": 2,
        "experience": "freshman",
        "title": "The Gathering Place",
        "location": "RVCE Auditorium",
        "difficulty": "Easy",
        "xp": 60,
    },
    {
        "id": 3,
        "experience": "tech",
        "title": "The Debug Zone",
        "location": "Innovation & Computer Labs",
        "difficulty": "Medium",
        "xp": 75,
    },
    {
        "id": 4,
        "experience": "tech",
        "title": "The Logic Gate",
        "location": "Engineering Block",
        "difficulty": "Medium",
        "xp": 80,
    },
    {
        "id": 5,
        "experience": "campus",
        "title": "The Energy Hub",
        "location": "Sports Ground",
        "difficulty": "Easy",
        "xp": 65,
    },
    {
        "id": 6,
        "experience": "campus",
        "title": "The Student Hub",
        "location": "Food Court",
        "difficulty": "Easy",
        "xp": 60,
    },
]


@app.get("/")
def root():
    return {
        "message": "Campus Cryptic API is running",
        "status": "online",
    }


@app.get("/missions")
def get_missions():
    return {
        "count": len(missions),
        "missions": missions,
    }


@app.get("/missions/{experience}")
def get_missions_by_experience(experience: str):
    filtered_missions = [
        mission
        for mission in missions
        if mission["experience"] == experience.lower()
    ]

    return {
        "experience": experience,
        "count": len(filtered_missions),
        "missions": filtered_missions,
    }


@app.get("/leaderboard")
def get_leaderboard():
    leaderboard = [
        {
            "rank": 1,
            "name": "CodeBreaker",
            "xp": 320,
            "locations_discovered": 6,
        },
        {
            "rank": 2,
            "name": "CampusExplorer",
            "xp": 275,
            "locations_discovered": 5,
        },
        {
            "rank": 3,
            "name": "PuzzleMaster",
            "xp": 210,
            "locations_discovered": 4,
        },
    ]

    return {
        "leaderboard": leaderboard,
    }


@app.get("/analytics")
def get_analytics():
    return {
        "total_missions": len(missions),
        "total_players": 42,
        "average_xp": 145,
        "most_discovered_location": "RVCE Central Library",
        "completion_rate": "68%",
    }


@app.get("/ai-hint/{mission_id}")
def get_ai_hint(mission_id: int):
    mission = next(
        (item for item in missions if item["id"] == mission_id),
        None,
    )

    if not mission:
        return {
            "error": "Mission not found"
        }

    hints = {
        1: "Think about a place where knowledge is stored.",
        2: "Think about a place where large events take place.",
        3: "Think about where programmers build and debug.",
        4: "Think about where engineering students attend classes.",
        5: "Think about where students play and compete.",
        6: "Think about where students eat and socialize.",
    }

    return {
        "mission_id": mission_id,
        "location": mission["location"],
        "ai_hint": hints.get(
            mission_id,
            "Explore the clues carefully and think about the campus."
        ),
    }


@app.get("/adaptive-difficulty")
def adaptive_difficulty(wrong_attempts: int = 0):
    if wrong_attempts >= 3:
        difficulty = "Easy"
        message = "Player is struggling. Recommend an easier mission."
    elif wrong_attempts >= 1:
        difficulty = "Medium"
        message = "Player needs moderate challenge and additional hints."
    else:
        difficulty = "Hard"
        message = "Player is performing well. Increase challenge."

    return {
        "recommended_difficulty": difficulty,
        "reason": message,
    }