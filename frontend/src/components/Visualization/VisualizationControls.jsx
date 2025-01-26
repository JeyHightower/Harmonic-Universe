{
  renderParameter("brightness", 0, 1, 0.01);
}
{
  renderParameter("saturation", 0, 1, 0.01);
}
{
  renderParameter("complexity", 0, 1, 0.01);
}
{
  renderParameter("color_scheme", [
    "rainbow",
    "monochrome",
    "complementary",
    "analogous",
    "triadic",
    "custom",
  ]);
}
{
  renderParameter("background_color", null, null, null, "color");
}
{
  renderParameter("particle_color", null, null, null, "color");
}
{
  renderParameter("glow_color", null, null, null, "color");
}
{
  renderParameter("particle_count", 100, 10000, 100);
}
{
  renderParameter("particle_size", 0.1, 10, 0.1);
}
{
  renderParameter("particle_speed", 0.1, 5, 0.1);
}
{
  renderParameter("glow_intensity", 0, 1, 0.01);
}
{
  renderParameter("blur_amount", 0, 1, 0.01);
}
{
  renderParameter("trail_length", 0, 1, 0.01);
}
{
  renderParameter("animation_speed", 0.1, 5, 0.1);
}
{
  renderParameter("bounce_factor", 0, 1, 0.01);
}
{
  renderParameter("rotation_speed", -5, 5, 0.1);
}
{
  renderParameter("camera_zoom", 0.1, 5, 0.1);
}
{
  renderParameter("camera_rotation", 0, 360, 1);
}
