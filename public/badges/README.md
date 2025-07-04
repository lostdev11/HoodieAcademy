# Squad Badge Images

This directory should contain the following badge images for the Hoodie Academy squad system:

## Required Badge Images

- `badge_creators.png` - Hoodie Creators squad badge (🎨)
- `badge_decoders.png` - Hoodie Decoders squad badge (🧠)
- `badge_raiders.png` - Hoodie Raiders squad badge (⚔️)
- `badge_speakers.png` - Hoodie Speakers squad badge (🎤)
- `badge_ranger.png` - Hoodie Rangers squad badge (🦅)

## Badge Specifications

- **Size**: 160x160 pixels (recommended)
- **Format**: PNG with transparency support
- **Style**: Should match the Hoodie Academy aesthetic
- **Design**: Each badge should incorporate the squad's emoji and color scheme

## Squad Color Schemes

- **Creators**: Yellow/Gold theme
- **Decoders**: Gray/Silver theme  
- **Raiders**: Blue theme
- **Speakers**: Red theme
- **Rangers**: Purple theme

## Implementation Notes

The badges are automatically displayed in:
1. Squad placement test results page
2. User profile page (when squad placement is completed)
3. Any other location where squad information is shown

The `SquadBadge` component handles the display logic and maps squad names to the correct badge images. 