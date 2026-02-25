FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for audio/video processing
# - libsndfile1: Required by soundfile/librosa for audio I/O
# - ffmpeg: Audio format conversion and processing
# - libsm6, libxext6: Required by opencv for image processing
# - libgomp1: OpenMP support for mediapipe
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --prefer-binary -r requirements.txt

# Copy application code
COPY . .

# Expose Hugging Face Spaces default port
EXPOSE 7860

# Run FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
