from fastapi import FastAPI
import firebase_admin
from firebase_admin import credentials, firestore

app = FastAPI(title="MESA API - Sprint 4")


cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "proyecto": "MESA",
        "mensaje": "Backend con FastAPI y Docker iniciado"
    }

@app.get("/test-db")
def test_db():
    try:
        docs = db.collection('restaurants').limit(1).get()
        return {
            "status": "conectado", 
            "mensaje": "Firestore responde correctamente",
            "evidencia": [doc.to_dict() for doc in docs]
        }
    except Exception as e:
        return {"status": "error", "detalle": str(e)}