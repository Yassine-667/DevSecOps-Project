# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set environment variables (if needed)
ENV APP_HOME /app
WORKDIR $APP_HOME

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
COPY . .

# Specify the command to run the application
CMD ["python", "app.py"]


