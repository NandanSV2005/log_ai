# LOG AI — Production Docker Container Definition
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set working directory inside container
WORKDIR /code

# Copy requirements and install dependencies
COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir -r /code/requirements.txt

# Copy application source code
COPY app/ /code/app/

# Create raw and normalized local data storage directories
RUN mkdir -p /code/data/raw /code/data/normalized

# Expose FastAPI application port
EXPOSE 8000

# Set entrypoint command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
