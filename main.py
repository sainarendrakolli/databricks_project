from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from databricks import sql
import os

app = FastAPI(title="Databricks Timing Dashboard")

# -----------------------
# CORS
# -----------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# STATIC FILES
# -----------------------
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# -----------------------
# ENV VARIABLES
# -----------------------
DATABRICKS_HOST = os.getenv("DATABRICKS_HOST")
HTTP_PATH = os.getenv("DATABRICKS_HTTP_PATH")
ACCESS_TOKEN = os.getenv("DATABRICKS_TOKEN")

# -----------------------
# HOME PAGE
# -----------------------
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# -----------------------
# API ENDPOINT
# -----------------------
@app.get("/timing-data")
def get_timing_data():
    query = """
        SELECT *
        FROM retail_cat.sales.v_gold_timing_dashboard
        ORDER BY ingestion_ts DESC
        LIMIT 500
    """

    with sql.connect(
        server_hostname=DATABRICKS_HOST,
        http_path=HTTP_PATH,
        access_token=ACCESS_TOKEN
    ) as conn:
        cursor = conn.cursor()
        cursor.execute(query)

        columns = [c[0] for c in cursor.description]
        rows = cursor.fetchall()

    return [dict(zip(columns, row)) for row in rows]
