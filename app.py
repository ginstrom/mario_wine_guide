from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# Ollama API endpoint
ollama_url = "http://ollama:11434/api/generate"


@app.route('/')
def index():
    try:
        response = requests.post(ollama_url,
                                 json={"model": "mario",
                                       "prompt": "Introduce yourself",
                                       "stream": False})
        
        response.raise_for_status()
        general_info = response.json().get("response", "Oops! Something went wrong while retrieving the information.")
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        general_info = "Oops! Something went wrong while retrieving the information."
    
    return render_template('index.html', general_info=general_info)

@app.route('/get_region_info', methods=['POST'])
def get_region_info():
    region_name = request.json.get('region')
    try:
        response = requests.post(ollama_url,
                                json={"model": "mario",
                                      "prompt": region_name,
                                      "stream": False})
        response.raise_for_status()
        regional_info = response.json().get("response", "Oops! Something went wrong while retrieving the information.")   
        return jsonify({"info": regional_info})
    
    except Exception as e:
        print(f"Unexpected error: {e}")
    return jsonify({"error": "Oops! Something went wrong while retrieving the information."})

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")