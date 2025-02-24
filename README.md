# Mario's Wine Guide - Interactive Tour of Italian Wines

An interactive map that helps you discover Italian wines and spirits. Click on any region of Italy, and Mario (our AI wine expert) will tell you all about the local specialties!

## Requirements

- Docker and Docker Compose installed on your system
- About 16GB of free RAM for optimal performance

## Quick Start

1. Clone the repository:
```sh
git clone https://github.com/alexpederneschi/mario_wine_guide.git
cd mario_wine_guide
```

2. Start the application:
```sh
docker-compose up --build
```

Note: First startup may take several minutes as it downloads and sets up the AI model.

3. Open in your browser:
```
http://localhost:5000
```

## How to Use

1. Wait for the application to fully start (you'll see the map of Italy)
2. Click on any region you're interested in
3. Mario will tell you about the wines and spirits from that region
4. Click outside the map or on the logo to return to the main view

## Troubleshooting

If the application doesn't start:
- Make sure ports 5000 and 11434 are available on your system
- Ensure Docker has access to at least 16GB of RAM
- Try stopping and restarting with `docker-compose down` followed by `docker-compose up --build`

## Credits

This project was originally created by [Alex Pederneschi](https://github.com/alexpederneschi).

## License

MIT License - Feel free to use and modify as needed.
