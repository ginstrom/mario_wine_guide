# Llama-Powered Tour of Italy’s Wines and Spirits

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

### 2. Set Up Ollama and the Llama3.2 Model:
Pull the Ollama Docker image:
```sh
docker pull ollama/ollama
```
Run the Ollama container and mount a volume for the model storage. Replace ~/ollama_models with the desired path on your host machine:
```sh
docker run -d -v ~/ollama_models:/root/.ollama -p 11434:11434 --name ollama-cnt ollama/ollama
```
Create the Mario AI agent using the Modelfile included in the project:
```sh
docker exec -it ollama-cnt ollama create mario -f /path/to/Modelfile
```
Once the Mario AI agent is created, you can stop and remove the ollama-cnt container.
```sh
docker stop ollama-cnt
docker rm ollama-cnt
```

### 3. Update Docker Compose Configuration:
Ensure the docker-compose.yml file points to the correct volume for the Ollama models. For example:
```sh
volumes:
  - ~/ollama_models:/root/.ollama
```

### 4. Use Docker Compose to build and run the application:
```sh
docker-compose up --build
```

### 5. Access the Application:
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
