# Use a slim Python image to keep the size down
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies for OpenCV and MediaPipe
# These are required because 'slim' images lack GUI/image processing libraries
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir keeps the image small
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
# This includes main.py, model.pkl, and the signs/ folder
COPY . .

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the application
# We use 1 worker to save memory/CPU on free-tier hosting
CMD ["uvicorn", "main.py:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]