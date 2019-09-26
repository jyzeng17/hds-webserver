#!/bin/bash

binDir=$(dirname $0)
binDir=$(realpath -s $binDir)
pathToPid="$binDir/pid"

if [ -f "$pathToPid" ]
then
	pid=$(cat $pathToPid)

	kill "$pid"

	rm "$pathToPid"

	echo "> HdsWebServer has stopped."
else
	echo "> Can't find any pid info of the HdsWebServer!"
	echo "> The server is either already stopped, or the pid is missing. In the latter case, you need to stop the server manually."
fi
