#!/bin/bash

binDir=$(dirname $0)
binDir=$(realpath -s $binDir)
pathToJar="$binDir/../target/hdrs-1.0-SNAPSHOT-jar-with-dependencies.jar"
mainClass="umc.cdc.hds.httpserver.HdsWebServer"
logDir="$binDir/../log"
pathToLogs="$logDir/logs"

if [ -f "$pathToJar" ]
then
	if [ ! -d "$logDir" ]; then
		mkdir $logDir;
	fi

	java -cp $pathToJar $mainClass > $pathToLogs 2>&1 &

	echo "$!" > "$binDir/pid"

	echo "> HdsWebServer has started."
	echo "> The default URI is http://localhost:8080/"
else
	echo "> $pathToJar not found, use mvn to build this project first."
fi
