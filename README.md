# Image Insight AI

Image Insight AI is an AI-powered image analysis application that allows users to upload images and receive insights based on a selected category. The system evaluates how well the uploaded image matches the chosen category and returns a relevance score in percentage.

## Features

### Category-Based Image Analysis
Users select a category before uploading an image. The AI then analyzes the image and returns a relevance score based on how well it matches the selected category.

### Example Behavior
- Electronics + human image → 0% match  
- Electronics + partial laptop image → ~50% match  
- Electronics + clear electronic device → ~90–100% match  

The system focuses on semantic understanding, not just object detection.

## Core Idea
Instead of only detecting objects, the system evaluates how strongly an image matches a user-defined category using AI vision (Gemini API).

## Tech Stack
- Frontend: React (Vite)
- Backend: Node.js / Express
- AI: Google Gemini API
- Styling: Tailwind CSS

## Project Structure
artifacts/ - backend and services  
image-analyzer/ - frontend application  
lib/ - shared utilities and API logic  
scripts/ - helper scripts  
package.json - dependencies  

## Setup Instructions

npm install  
npm run dev  

## Environment Variables

GEMINI_API_KEY=your_api_key_here

Do not expose API keys publicly.

## Future Improvements
- Improve category matching accuracy  
- Add image history feature  
- Add confidence score visualization  
- Support multiple categories  
- Improve UI feedback system  

## Purpose
This project was built for internship learning to explore AI image understanding, full-stack development, and API integration using Google Gemini.

## License
For educational and internship use only.
