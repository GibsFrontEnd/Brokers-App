# Images for GIBS Enterprise

## Required Images

### 1. Landing Page Image

**File:** `landing_img.png`
**Location:** `src/assets/landing_img.png`
**Used in:** `src/pages/HomePage.jsx`
**Description:** Main hero image for the home page

### 2. Dashboard Preview Image

**File:** `dash_image.png`
**Location:** `src/assets/dash_image.png`
**Used in:** `src/components/Login.jsx`
**Description:** Preview image for the "What's New" section on the login page

## How to Add Images

1. Place your images in the `src/assets/` folder
2. Uncomment the import statements in the respective files:
   - In `HomePage.jsx`: Uncomment `import landingImage from "../assets/landing_img.png";`
   - In `Login.jsx`: Uncomment `import dashImage from "../assets/dash_image.png";`
3. Uncomment the `<img>` tag and remove the placeholder div

## Placeholder Status

Currently, both pages are using SVG placeholders. Replace them with actual images for the production-ready look.
