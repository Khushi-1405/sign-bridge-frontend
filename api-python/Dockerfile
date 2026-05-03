# Use Bullseye (Debian 11) for better stability with OpenCV/MediaPipe
FROM python:3.10-slim-bullseye

# Set the working directory
WORKDIR /app

# Install the correct updated system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
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
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]