#!/bin/bash

cd src/components

# Create main directory structure
mkdir -p {common,layout,features}/{ui,logic}

# Move UI components to features
mv Universe* features/ui/
mv Scene* features/ui/
mv Physics* features/ui/
mv Music* features/ui/
mv Audio* features/ui/
mv Story* features/ui/
mv Visual* features/ui/

# Move feature-specific logic
mv PhysicsEngine.js features/logic/
mv PhysicsConstraintEditor.js features/logic/
mv PhysicsObjectEditor.js features/logic/

# Move test files to proper location
mkdir -p ../../tests/features
mv *.test.js ../../tests/features/

# Organize features by domain
cd features/ui
mkdir -p {universe,scene,physics,audio,storyboard,visualization}
mv Universe* universe/
mv Scene* scene/
mv Physics* physics/
mv Music* audio/
mv Audio* audio/
mv Story* storyboard/
mv Visual* visualization/

# Move remaining components to appropriate directories
cd ../..
mv Analytics features/ui/analytics
mv Settings features/ui/settings
mv Profile features/ui/profile
mv Presence features/ui/presence
mv Comments features/ui/comments
mv Collaboration features/ui/collaboration
mv RichTextEditor features/ui/editor
mv Templates features/ui/templates
mv BatchOperations features/ui/operations
mv VirtualList common/ui/
mv Navigation layout/ui/
mv Notifications common/ui/

# Clean up old directories
rm -rf Common Layout App

echo "Frontend reorganization complete!"
