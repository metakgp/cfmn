#!/bin/sh

# Run this script with the binary or the command that starts the project
# Eg: ./postinstall.sh npm start
# Eg: ./postinstall.sh ./build/server

# This function removes the metaploy config file from the volume when the project crashes or stops
cleanup() {
    echo "Container stopped. Removing nginx HTTPS configuration."
    rm /etc/nginx/https-enabled/cfmn.metaploy.conf
}

# Run the cleanup function if either of the below signals are received
trap 'cleanup' SIGQUIT SIGTERM SIGHUP

# Run the command provided to the arguments (starts the project server)
"${@}" &

# Copies the metaploy config file to the correct directory
cp ./cfmn.metaploy.conf /etc/nginx/https-enabled

# Waits for the server process to stop (lets it run)
wait $!
