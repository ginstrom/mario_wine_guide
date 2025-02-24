from flask import Flask, render_template, request, jsonify, make_response
from flask_cors import CORS
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import logging
import json
import uuid

app = Flask(__name__)
CORS(app)

# Store ongoing requests
request_tracker = {}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama API endpoint
ollama_url = "http://ollama:11434/api/generate"

# Configure retry strategy
retry_strategy = Retry(
    total=3,  # number of retries
    backoff_factor=1,  # wait 1, 2, 4 seconds between retries
    status_forcelist=[500, 502, 503, 504]  # HTTP status codes to retry on
)

# Create session with retry strategy
session = requests.Session()
adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=10)
session.mount("http://", adapter)
session.mount("https://", adapter)


@app.route('/')
def index():
    try:
        response = requests.post(ollama_url,
                               json={"model": "mario",
                                    "prompt": "Introduce yourself",
                                    "stream": True},  # Enable streaming
                               timeout=30,  # Increase timeout further
                               stream=True)  # Enable requests streaming
        
        response.raise_for_status()
        # Collect the complete response from the stream
        full_response = ""
        for line in response.iter_lines():
            if line:
                json_response = json.loads(line)
                if json_response.get("response"):
                    full_response += json_response["response"]
        
        general_info = full_response if full_response else "Oops! Something went wrong while retrieving the information."
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        general_info = "Oops! Something went wrong while retrieving the information."
    
    return render_template('index.html', general_info=general_info)

@app.route('/get_region_info', methods=['POST'])
def get_region_info():
    logger.info("Received request to /get_region_info")
    if not request.json or 'region' not in request.json:
        logger.warning("Missing region parameter in request")
        return jsonify({"error": "Missing region parameter"}), 400
        
    region_name = request.json.get('region')
    request_id = str(uuid.uuid4())
    logger.info(f"Region name received: {region_name} (Request ID: {request_id})")
    
    # Cancel any existing request for this region
    for rid, info in list(request_tracker.items()):
        if info['region'] == region_name:
            logger.info(f"Cancelling previous request {rid} for region {region_name}")
            request_tracker.pop(rid)
    
    # Track this request
    request_tracker[request_id] = {
        'region': region_name,
        'status': 'processing'
    }
    
    try:
        logger.info(f"Making request to Ollama API for region: {region_name} (Request ID: {request_id})")
        # Construct a more specific prompt for the region
        prompt = f"Tell me about the wines and wine regions of {region_name}, Italy. Include information about popular grape varieties, notable wines, and wine-making traditions."
        
        logger.info(f"Sending prompt to Ollama API: {prompt}")
        response = session.post(ollama_url,
                              json={"model": "mario",
                                   "prompt": prompt,
                                   "stream": True},
                              timeout=60)
        response.raise_for_status()
        
        # Collect the complete response from the stream
        full_response = ""
        response_parts = []
        for line in response.iter_lines():
            if line:
                try:
                    json_response = json.loads(line)
                    if json_response.get("response"):
                        response_part = json_response["response"]
                        response_parts.append(response_part)
                        full_response += response_part
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode JSON from Ollama API: {e} (Request ID: {request_id})")
                    continue
        
        if not full_response:
            logger.error(f"Empty response from Ollama API for region: {region_name} (Request ID: {request_id})")
            logger.debug(f"Response parts received: {response_parts}")
            request_tracker[request_id]['status'] = 'error'
            return jsonify({
                "error": "No information available for this region. The AI model did not provide a response.",
                "request_id": request_id
            }), 500
            
        regional_info = full_response
        logger.info(f"Successfully received response from Ollama API for region: {region_name} (Request ID: {request_id})")
        
        # Update request status
        request_tracker[request_id]['status'] = 'completed'
        
        # Create response with headers
        response = make_response(jsonify({
            "info": regional_info,
            "request_id": request_id
        }))
        response.headers['X-Request-ID'] = request_id
        return response
    
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        logger.error(f"Request error in /get_region_info for region {region_name} (Request ID: {request_id}): {error_msg}")
        request_tracker[request_id]['status'] = 'error'
        if "Connection refused" in error_msg:
            return jsonify({
                "error": "Unable to connect to the AI service. Please try again in a few moments.",
                "request_id": request_id
            }), 503
        elif "timeout" in error_msg.lower():
            return jsonify({
                "error": "The request timed out. Please try again.",
                "request_id": request_id
            }), 504
        else:
            return jsonify({
                "error": "Failed to connect to the AI service. Please try again later.",
                "request_id": request_id
            }), 503
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error in /get_region_info for region {region_name} (Request ID: {request_id}): {e}")
        request_tracker[request_id]['status'] = 'error'
        return jsonify({
            "error": "Invalid response format from the AI service. Please try again.",
            "request_id": request_id
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error in /get_region_info for region {region_name} (Request ID: {request_id}): {e}")
        request_tracker[request_id]['status'] = 'error'
        return jsonify({
            "error": "An unexpected error occurred. Our team has been notified.",
            "request_id": request_id
        }), 500
    finally:
        # Clean up old completed/error requests
        for rid in list(request_tracker.keys()):
            if request_tracker[rid]['status'] in ['completed', 'error']:
                request_tracker.pop(rid)

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
