import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_create_storyboard_flow(selenium):
    """Test the complete flow of creating a storyboard through the UI"""

    # Login
    selenium.get("/login")
    email_input = selenium.find_element(By.NAME, "email")
    password_input = selenium.find_element(By.NAME, "password")

    email_input.send_keys("test@example.com")
    password_input.send_keys("password123")
    selenium.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

    # Wait for redirect to dashboard
    WebDriverWait(selenium, 10).until(EC.url_to_be("/dashboard"))

    # Navigate to universe detail page (assuming we have a universe)
    universe_link = selenium.find_element(By.CLASS_NAME, "universe-link")
    universe_link.click()

    # Wait for universe page to load
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "universe-details"))
    )

    # Click create storyboard button
    create_button = selenium.find_element(By.ID, "create-storyboard-btn")
    create_button.click()

    # Wait for storyboard form
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "storyboard-form"))
    )

    # Fill storyboard form
    name_input = selenium.find_element(By.NAME, "name")
    description_input = selenium.find_element(By.NAME, "description")

    name_input.send_keys("E2E Test Storyboard")
    description_input.send_keys("Created through E2E test")

    # Submit form
    selenium.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

    # Wait for redirect to storyboard page
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "storyboard-details"))
    )

    # Verify storyboard was created
    storyboard_title = selenium.find_element(By.CLASS_NAME, "storyboard-title")
    assert storyboard_title.text == "E2E Test Storyboard"

    # Add scenes to storyboard
    add_scene_button = selenium.find_element(By.ID, "add-scenes-btn")
    add_scene_button.click()

    # Wait for scene selection modal
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "scene-selection-modal"))
    )

    # Select scenes
    scene_checkboxes = selenium.find_elements(By.CSS_SELECTOR, ".scene-checkbox")
    for checkbox in scene_checkboxes[:2]:  # Select first two scenes
        checkbox.click()

    # Save scene selection
    selenium.find_element(By.ID, "save-scene-selection").click()

    # Wait for modal to close and scenes to appear
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "storyboard-scenes"))
    )

    # Verify scenes were added
    scene_elements = selenium.find_elements(By.CLASS_NAME, "storyboard-scene")
    assert len(scene_elements) == 2
