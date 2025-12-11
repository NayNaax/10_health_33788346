# Bitality Health & Fitness App

A comprehensive web-based application for tracking workouts, nutrition, and health metrics.

## Getting Started

### Prerequisites

-   Node.js (v14+ recommended)
-   MySQL Server

### Installation

1.  Clone the repository or download the source code.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Database Setup

1.  Ensure MySQL is running.
2.  Import the database schema:
    ```bash
    node init_db.js
    ```
    _This script creates the `health` database and seeds it with initial data._

### Configuration

1.  Create a `.env` file in the root directory (if not present) with the following:
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password
    DB_NAME=health
    API_NINJAS_KEY=your_key_here
    CALORIE_NINJAS_KEY=your_key_here
    ```

### Running the App

1.  Start the server:
    ```bash
    npm start
    ```
2.  Open your browser and navigate to `http://localhost:8000`.

## Features

-   **User Authentication**: Secure Login/Register/Logout.
-   **Dashboard**: Quick stats (Calories, Workouts, Water) and activity feed.
-   **Fitness Logging**: Track workouts with duration, intensity, and calories.
-   **Water Tracker**: Persist your daily water intake.
-   **Nutrition Tracker**: Log meals using natural language (e.g., "1 apple and 2 eggs").
-   **Find Exercises**: Search for new exercises by muscle group.
-   **Health Tools**: BMI Calculator, BMR Calculator, Macro Split.
-   **Dark Mode**: Toggle between light and dark themes.

## technology Stack

-   **Backend**: Node.js, Express.js
-   **Database**: MySQL
-   **Frontend**: EJS, CSS (Vanilla), JavaScript
-   **APIs**: API Ninjas (Exercises), CalorieNinjas (Nutrition)
