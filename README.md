# Hoodie Academy

A Next.js project for an educational platform focused on Solana and NFTs, featuring token gating and course content.

## Technologies Used

*   Next.js
*   React
*   TypeScript
*   Tailwind CSS
*   Solana Web3.js
*   Helius API
*   Radix UI
*   Embla Carousel

## Features

*   Token-gated content based on NFT ownership.
*   Integration with the Helius API for NFT verification.
*   Interactive course content with lessons and quizzes.
*   Progress tracking for courses.
*   Responsive UI components using Radix UI and Tailwind CSS.
*   Image carousel on the home page.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/HoodieAcademy.git
    cd HoodieAcademy
    ```
    *(Replace `your-username` with your GitHub username if you forked the repository)*

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of your project and add your Helius API key:
    ```env
    NEXT_PUBLIC_HELIUS_API_KEY=YOUR_HELIUS_API_KEY
    ```
    *(Replace `YOUR_HELIUS_API_KEY` with your actual Helius API key)*

4.  **Place Images:**
    Ensure your project images, such as `hoodie-academy-pixel-art-logo.png`, are located in the `public/images` directory. Create the directory if it doesn't exist.

## Running the Project

1.  **Build the project:**
    ```bash
    npm run build
    ```

2.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running at `http://localhost:3000`.

## Usage

(You can add more details here about how users can interact with the platform, like connecting wallets, accessing courses, etc.) 