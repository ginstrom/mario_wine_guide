# Llama-Powered Tour of Italy's Wines and Spirits

This project is a web application that displays an interactive map of Italy. Users can select a region, and the application generates information about the wines and alcoholic beverages of that region using an AI agent named Mario, powered by Llama3.2.

## Table of Contents

1. [Setup Instructions](#installation)
2. [Usage](#usage)
3. [License](#license)

## Setup Instructions

### 1. Clone the Repository:
```sh
git clone https://github.com/alexpederneschi/mario_wine_guide.git
cd mario_wine_guide
```

### 2. Run with Docker Compose:
```sh
docker-compose up --build
```
This will automatically:
- Pull necessary Docker images
- Set up the Llama3.2 model
- Create the Mario AI agent
- Start the web application

Note: The first run may take several minutes as it downloads and sets up the Llama model.

### 3. Access the Application:
Once the containers are running, open your browser and navigate to:
```sh
http://localhost:5000
```

## Usage
Interactive Map: The application displays a map of Italy. Users can select a region by clicking on it.

AI-Powered Information: When a region is selected, the AI agent Mario generates detailed information about the wines and alcoholic beverages of that region.

General Information: By default, the application displays introductory information about the AI agent Mario. Clicking outside the map or on the logo reverts to this general information.

## License
This project is licensed under the MIT License. Feel free to use, modify, and distribute it as needed.
