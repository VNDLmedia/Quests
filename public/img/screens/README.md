# POI Screen Images

Place your fullscreen POI images in this directory.

## Usage

When creating a POI in the admin interface, enter just the filename (e.g., `welcome.jpg`) in the "Fullscreen Bild" field.

The app will automatically load the image from `/img/screens/{filename}`.

## Supported Formats

- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`

## Recommended Specifications

- **Resolution**: At least 1080x1920 (portrait) or 1920x1080 (landscape)
- **File Size**: Keep under 2MB for fast loading
- **Aspect Ratio**: Works best with standard phone aspect ratios (16:9, 19.5:9)

## Example

1. Add your image: `public/img/screens/station1-welcome.jpg`
2. In POI creation, enter: `station1-welcome.jpg`
3. When users scan the POI, the image will display fullscreen
