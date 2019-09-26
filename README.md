# hds-webserver

- A web service which provides web interfaces to perform the functionalities in HDS and to view the parsed results returned by HDS in table forms.

### Usage

1. Clone this project to one of the servers that runs HDS.
```
	$ git clone https://github.com/jyzeng17/hds-webserver.git
```
2. Inside the cloned directory, use Maven to build the project.
```
	$ mvn package
```
3. To run the server, execute `bin/run.sh`.
	- **NOTE**: `realpath` should be installed in your environment.
```
	$ ./bin/run.sh
```
4. To stop the server, execute `bin/stop.sh`.
	- **NOTE**: `realpath` should be installed in your environment.
```
	$ ./bin/stop.sh
```
