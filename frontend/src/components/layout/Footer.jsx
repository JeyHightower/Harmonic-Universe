import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import { Box, Container, IconButton, Link, Typography } from "@mui/material";
import React from "react";
import { Link as RouterLink } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
        backgroundColor: (theme) => theme.palette.background.paper,
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Harmonic Universe. All rights
              reserved.
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                "& > *": {
                  color: "text.secondary",
                  textDecoration: "none",
                  "&:hover": {
                    color: "primary.main",
                  },
                },
              }}
            >
              <Link component={RouterLink} to="/about" variant="body2">
                About
              </Link>
              <Link component={RouterLink} to="/privacy" variant="body2">
                Privacy
              </Link>
              <Link component={RouterLink} to="/terms" variant="body2">
                Terms
              </Link>
              <Link component={RouterLink} to="/contact" variant="body2">
                Contact
              </Link>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              href="https://github.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              color="inherit"
            >
              <GitHubIcon />
            </IconButton>
            <IconButton
              href="https://twitter.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              color="inherit"
            >
              <TwitterIcon />
            </IconButton>
            <IconButton
              href="https://linkedin.com/in/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              color="inherit"
            >
              <LinkedInIcon />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
