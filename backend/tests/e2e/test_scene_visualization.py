import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

def test_scene_visualization_flow(selenium):
    """Test the complete flow of visualizing a scene through the UI"""

    # Login
    selenium.get('/login')
    email_input = selenium.find_element(By.NAME, 'email')
    password_input = selenium.find_element(By.NAME, 'password')

    email_input.send_keys('test@example.com')
    password_input.send_keys('password123')
    selenium.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

    # Wait for redirect to dashboard
    WebDriverWait(selenium, 10).until(
        EC.url_to_be('/dashboard')
    )

    # Navigate to universe detail page
    universe_link = selenium.find_element(By.CLASS_NAME, 'universe-link')
    universe_link.click()

    # Wait for universe page to load
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'universe-details'))
    )

    # Click on a scene
    scene_link = selenium.find_element(By.CLASS_NAME, 'scene-link')
    scene_link.click()

    # Wait for scene visualization page
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'scene-visualization'))
    )

    # Test visualization controls

    # Play/Pause
    play_button = selenium.find_element(By.ID, 'play-visualization')
    play_button.click()

    # Wait for animation to start
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'playing'))
    )

    # Adjust timeline
    timeline = selenium.find_element(By.ID, 'visualization-timeline')
    actions = ActionChains(selenium)
    actions.move_to_element(timeline)
    actions.click_and_hold()
    actions.move_by_offset(100, 0)  # Move right by 100 pixels
    actions.release()
    actions.perform()

    # Verify timeline position changed
    timeline_value = timeline.get_attribute('value')
    assert float(timeline_value) > 0

    # Test camera controls
    camera_controls = selenium.find_element(By.CLASS_NAME, 'camera-controls')

    # Zoom in
    zoom_in = camera_controls.find_element(By.ID, 'zoom-in')
    zoom_in.click()

    # Pan camera
    pan_right = camera_controls.find_element(By.ID, 'pan-right')
    pan_right.click()

    # Rotate camera
    rotate_up = camera_controls.find_element(By.ID, 'rotate-up')
    rotate_up.click()

    # Test parameter adjustments
    parameter_panel = selenium.find_element(By.CLASS_NAME, 'parameter-panel')

    # Adjust a physics parameter
    physics_slider = parameter_panel.find_element(By.NAME, 'gravity')
    actions = ActionChains(selenium)
    actions.move_to_element(physics_slider)
    actions.click_and_hold()
    actions.move_by_offset(50, 0)  # Increase value
    actions.release()
    actions.perform()

    # Verify parameter change
    parameter_value = physics_slider.get_attribute('value')
    assert float(parameter_value) > 0

    # Save visualization state
    save_button = selenium.find_element(By.ID, 'save-visualization')
    save_button.click()

    # Wait for save confirmation
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'save-success'))
    )
