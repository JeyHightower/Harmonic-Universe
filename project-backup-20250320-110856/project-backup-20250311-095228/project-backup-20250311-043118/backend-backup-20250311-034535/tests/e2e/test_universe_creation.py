import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_create_universe_flow(selenium):
    """Test the complete flow of creating a universe through the UI"""

    # Login
    selenium.get("/login")
    email_input = selenium.find_element(By.NAME, "email")
    password_input = selenium.find_element(By.NAME, "password")

    email_input.send_keys("test@example.com")
    password_input.send_keys("password123")
    selenium.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

    # Wait for redirect to dashboard
    WebDriverWait(selenium, 10).until(EC.url_to_be("/dashboard"))

    # Click create universe button
    create_button = selenium.find_element(By.ID, "create-universe-btn")
    create_button.click()

    # Fill universe form
    name_input = selenium.find_element(By.NAME, "name")
    description_input = selenium.find_element(By.NAME, "description")

    name_input.send_keys("E2E Test Universe")
    description_input.send_keys("Created through E2E test")

    # Submit form
    selenium.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

    # Wait for redirect to universe page
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "universe-details"))
    )

    # Verify universe was created
    universe_title = selenium.find_element(By.CLASS_NAME, "universe-title")
    assert universe_title.text == "E2E Test Universe"
