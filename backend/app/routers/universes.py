from fastapi import APIRouter

router = APIRouter(
    prefix="/universes",
    tags=["universes"]
)

@router.get("/")
async def get_universes():
    return {"message": "Universes endpoint"}
