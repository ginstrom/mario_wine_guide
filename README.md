# Llama-Powered Tour of Italy’s Wines and Spirits

This project is a web application that displays an interactive map of Italy. Users can select a region, and the application generates information about the wines and alcoholic beverages of that region using an AI agent named Mario, powered by Llama3.2.


## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup Instructions](#installation)
3. [Usage](#usage)
4. [License](#license)


## Prerequisites

Before running the application, ensure you have the following installed:

**Ollama**: A tool for running and interacting with the Llama3.2 model. You can download and install Ollama from [here](https://ollama.com/).

**Llama3.2 Model**: The base model required for the AI agent.

**Mario Agent**: Create the Mario agent using the provided Modelfile. Run the following command in your terminal:
  ```sh
  ollama create mario -f /path/to/Modelfile
```


## Setup Instructions

### Clone the Repository:
```sh
git clone https://github.com/alexpederneschi/mario_wine_guide.git
cd mario_wine_guide
```

### Set up a virtual environment
```sh
python -m venv venv
source venv/bin/activate
```

### Install Python Dependencies:
```sh
pip install -r requirements.txt
```

### Run the Application:
```sh
python app.py
```

### Open your browser and navigate to:
http://localhost:5000


## Usage
Interactive Map: The application displays a map of Italy. Users can select a region by clicking on it.

AI-Powered Information: When a region is selected, the AI agent Mario generates detailed information about the wines and alcoholic beverages of that region.

General Information: By default, the application displays introductory information about the AI agent Mario. Clicking outside the map or on the logo reverts to this general information.


## License
This project is licensed under the MIT License. Feel free to use, modify, and distribute it as needed.

