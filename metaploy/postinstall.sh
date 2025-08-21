#!/bin/sh

cleanup() {
	echo "Container stopped. Removing nginx configuration."
	rm /etc/nginx/sites-enabled/cfmn.metaploy.conf
}

trap 'cleanup' SIGQUIT SIGTERM SIGHUP

"${@}" &

cp ./cfmn.metaploy.conf /etc/nginx/sites-enabled

wait $!