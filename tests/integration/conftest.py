@pytest.fixture(scope="module")
def client() -> Generator:
    """Create a test client for the FastAPI app."""
    with TestClient(app) as c:
        yield c
