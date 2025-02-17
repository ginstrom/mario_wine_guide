# Basic image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /code

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

EXPOSE 5000

# Command to run the Flask application
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]