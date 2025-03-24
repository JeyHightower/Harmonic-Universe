#!/bin/bash

echo "Setting up GPG signing for git commits..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "Homebrew already installed"
fi

# Install GPG
echo "Installing GPG..."
brew install gnupg

# Generate GPG key if not exists
if ! gpg --list-secret-keys --keyid-format LONG | grep sec > /dev/null; then
    echo "Generating GPG key..."
    gpg --full-generate-key
fi

# Get GPG key ID
GPG_KEY_ID=$(gpg --list-secret-keys --keyid-format LONG | grep sec | awk '{print $2}' | cut -d'/' -f2)

if [ -n "$GPG_KEY_ID" ]; then
    echo "Configuring git to use GPG key..."
    git config --global commit.gpgsign true
    git config --global user.signingkey "$GPG_KEY_ID"
    
    echo "Your GPG key: $GPG_KEY_ID"
    echo "Please add this key to your GitHub account:"
    gpg --armor --export "$GPG_KEY_ID"
else
    echo "Error: Could not find GPG key"
    exit 1
fi

echo "GPG setup complete!" 