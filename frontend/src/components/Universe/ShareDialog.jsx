import { useUI } from "@/hooks/useUI";
import {
  ContentCopy as ContentCopyIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  universeId: number;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  universeId,
}) => {
  const { showAlert } = useUI();
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/universe/${universeId}`;

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showAlert({
        type: "success",
        message: "Link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showAlert({
        type: "error",
        message: "Failed to copy link",
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    let url = "";
    const text =
      "Check out this amazing universe I found on Harmonic Universe!";

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text,
        )}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl,
        )}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl,
        )}`;
        break;
      default:
        return;
    }

    window.open(url, "_blank", "width=600,height=400");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Universe</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Share this universe with your friends and colleagues
        </Typography>

        <TextField
          fullWidth
          value={shareUrl}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={copied ? "Copied!" : "Copy link"}>
                  <IconButton onClick={handleCopyClick} edge="end">
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Share on social media
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<TwitterIcon />}
              onClick={() => handleSocialShare("twitter")}
            >
              Twitter
            </Button>
            <Button
              variant="outlined"
              startIcon={<FacebookIcon />}
              onClick={() => handleSocialShare("facebook")}
            >
              Facebook
            </Button>
            <Button
              variant="outlined"
              startIcon={<LinkedInIcon />}
              onClick={() => handleSocialShare("linkedin")}
            >
              LinkedIn
            </Button>
          </Stack>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Note: Only users with appropriate permissions will be able to view
          this universe.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
