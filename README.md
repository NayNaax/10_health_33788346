# Bitality Health & Fitness App

A comprehensive web-based application for tracking workouts, nutrition, and health metrics.

## Live Deployment

Access the application here: **[https://doc.gold.ac.uk/usr/355/](https://doc.gold.ac.uk/usr/355/)**

## Features

-   **Accessible to All**: Works without login! Guest users (User ID 1) can explore all features immediately.
-   **User Authentication**: Optional Login/Register for personalized accounts.
-   **Dashboard**: Quick stats (Calories, Workouts, Water) and activity feed.
-   **Fitness Logging**: Track workouts with duration, intensity, and calories.
-   **Water Tracker**: Persist your daily water intake.
-   **Nutrition Tracker**: Log meals using natural language (e.g., "1 apple and 2 eggs").
-   **Find Exercises**: Search for new exercises by muscle group.
-   **Health Tools**: BMI Calculator, BMR Calculator, Macro Split.
-   **Dark Mode**: Toggle between light and dark themes.

## Technology Stack

-   **Backend**: Node.js, Express.js
-   **Database**: MySQL
-   **Frontend**: EJS, CSS (Vanilla), JavaScript
-   **APIs**: API Ninjas (Exercises), CalorieNinjas (Nutrition)

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

1.  Create a `.env` file in the root directory with the following:

    ```env
    # Database Configuration
    HEALTH_HOST=localhost
    HEALTH_USER=health_app
    HEALTH_PASSWORD=your_password
    HEALTH_DATABASE=health

    # API Keys
    API_NINJAS_KEY=your_key_here
    CALORIE_NINJAS_KEY=your_key_here

    # Deployment
    # LOCAL DEVELOPMENT: Must be set to /usr/355 to match hardcoded redirects
    HEALTH_BASE_PATH=/usr/355
    ```

### Running the Application

1.  Start the server:
    ```bash
    npm start
    ```
2.  Open your browser to: **[http://localhost:8000/usr/355/](http://localhost:8000/usr/355/)**
