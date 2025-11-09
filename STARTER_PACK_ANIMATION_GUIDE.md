# Starter Pack Animation Guide

## How to Add Your Custom Hovering Animation

### Step 1: Prepare Your Animation File

Place your animation file in the `public` folder:

```
public/
  animations/
    pack-hovering.gif    (for GIF)
    pack-hovering.mp4    (for video)
    pack-hovering.webm   (for video)
    pack-hovering.json   (for Lottie)
    pack-hovering-frame-*.png  (for image sequence)
```

### Step 2: Choose Your Animation Type

#### Option 1: GIF Animation (Easiest)

1. Add your GIF to `public/animations/pack-hovering.gif`
2. In `src/app/starter-pack/page.tsx`, uncomment the GIF option:

```tsx
<img 
  src="/animations/pack-hovering.gif" 
  alt="Pack Hovering" 
  className="w-64 h-64 object-contain"
/>
```

#### Option 2: Video Animation (Best Quality)

**For MOV files:**
1. Add your MOV file to `public/animations/pack-hovering.mov`
2. **Recommended**: Convert to MP4 for better browser support (see conversion guide below)
3. In `src/app/starter-pack/page.tsx`, uncomment the video option:

```tsx
<video 
  autoPlay 
  loop 
  muted 
  playsInline
  className="w-64 h-64 object-contain"
>
  <source src="/animations/pack-hovering.mov" type="video/quicktime" />
  <source src="/animations/pack-hovering.mp4" type="video/mp4" />
  <source src="/animations/pack-hovering.webm" type="video/webm" />
  Your browser does not support the video tag.
</video>
```

**Converting MOV to MP4 (Recommended):**

MOV files may not work in all browsers. Here are easy ways to convert:

**Option A: Online Converter (Easiest)**
- Visit: https://cloudconvert.com/mov-to-mp4
- Upload your .mov file
- Download the .mp4 version
- Place both files in `public/animations/`

**Option B: FFmpeg (Command Line)**
```bash
ffmpeg -i pack-hovering.mov -c:v libx264 -c:a aac -b:a 192k pack-hovering.mp4
```

**Option C: VLC Media Player**
1. Open VLC
2. Media → Convert/Save
3. Add your .mov file
4. Convert/Save → Choose MP4 profile
5. Start conversion

**Option D: QuickTime (Mac)**
1. Open .mov in QuickTime
2. File → Export As → Web (creates .mp4)

### Bonus: Success Animation (after claim)

You can also customize the animation that plays after a successful claim.

1. Convert your success animation to MP4 (same steps as above)
2. Save it (or rename it) to whatever file you prefer, e.g. `public/animations/IMG_0319.gif`
3. Configure the paths in `.env.local` so the app knows which files to use:
   ```env
   NEXT_PUBLIC_STARTER_PACK_SUCCESS_VIDEO_PATH=/animations/pack-claim-success.mp4   # optional
   NEXT_PUBLIC_STARTER_PACK_SUCCESS_GIF_PATH=/animations/IMG_0319.gif
   ```
   You can disable either by setting `NEXT_PUBLIC_STARTER_PACK_SUCCESS_VIDEO=false` or `NEXT_PUBLIC_STARTER_PACK_SUCCESS_GIF=false`.
4. When present, the app will play the MP4. If it fails to load, it falls back to the GIF. If both fail, a default success message appears.

### Bonus: Development Tips

To skip on-chain payment verification while you are testing locally:

```env
STARTER_PACK_SKIP_PAYMENT_CHECK=true
```

> ⚠️ **Never enable this in production.** It is purely for local testing so you can see the success animation and UI flow without moving SOL on mainnet.

#### Option 3: Lottie Animation (Most Flexible)

1. Install Lottie React:
```bash
npm install lottie-react
```

2. Add your Lottie JSON to `public/animations/pack-hovering.json`
3. In `src/app/starter-pack/page.tsx`:

```tsx
import Lottie from 'lottie-react';
import packHoveringAnimation from '@/public/animations/pack-hovering.json';

// Then in the component:
<Lottie 
  animationData={packHoveringAnimation} 
  loop={true}
  className="w-64 h-64"
/>
```

#### Option 4: Image Sequence

1. Add your image frames to `public/animations/`
2. Use CSS animation or JavaScript to cycle through frames

#### Option 5: Custom React Component

1. Create your animation component in `src/components/animations/PackHovering.tsx`
2. Import and use it:

```tsx
import PackHovering from '@/components/animations/PackHovering';

// Then in the component:
<PackHovering />
```

### Step 3: Adjust Size and Position

Modify the className to adjust size:

```tsx
// Small
className="w-32 h-32 object-contain"

// Medium (default)
className="w-64 h-64 object-contain"

// Large
className="w-96 h-96 object-contain"

// Full screen
className="w-screen h-screen object-contain"
```

### Step 4: Remove Default Animation

Once your custom animation is working, remove or comment out the default placeholder animation (the one with the Gift icon).

## Location in Code

The animation code is in:
- File: `src/app/starter-pack/page.tsx`
- Lines: ~314-350 (Pack Hovering Animation section)

## Tips

1. **File Size**: Keep animations under 2MB for fast loading
2. **Format**: Use WebP for images, MP4/WebM for videos
3. **Loop**: Make sure your animation loops seamlessly
4. **Performance**: Test on mobile devices to ensure smooth playback
5. **Accessibility**: Add alt text for screen readers

## Example: Complete GIF Implementation

```tsx
{/* Pack Hovering Animation */}
<AnimatePresence>
  {showPackHover && !showRipReveal && walletAddress && !claimStatus && (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
    >
      <motion.div
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <img 
          src="/animations/pack-hovering.gif" 
          alt="Pack Hovering" 
          className="w-64 h-64 object-contain drop-shadow-2xl"
        />
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

