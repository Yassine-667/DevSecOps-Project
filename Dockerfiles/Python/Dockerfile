# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed dependencies specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make the port that your app listens on inside the container available to the world outside this container
EXPOSE 8000 

# Change this to the port your app listens on


# Run app.py when the container launches
CMD ["python", "app.py"]