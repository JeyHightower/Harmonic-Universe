from fastapi import APIRouter

router = APIRouter(
    prefix="/scenes",
    tags=["scenes"]
)

@router.get("/")
async def get_scenes():
    return {"message": "Scenes endpoint"}
