(function() {
	"use strict";

	let selectedProtocol = "";
	let nextSelectPickerFromID = 0;

	function createQueryFormGroups() {
		let html = new QueryFormGroup('from').
			setRequired().setProtocolButtonGroup().html() +
			createSelectPickerFormGroup("from") +
			new QueryFormGroup('recursive').
			setPlaceholder(PLACEHOLDER.BOOLEAN).html();

		$("#query-form-groups").html(html);

		$(".protocol-btn").on("click", function() {
			let query = $(this).attr("query");
			let thisProtocol = $(this).attr("protocol");

			// Change color
			$(this).attr("style", "color: #ffffff; background: #428bca");
			PROTOCOLS.forEach(function (protocol) {
				if (protocol !== thisProtocol) {
					$("#button-" + query + "-" + protocol).removeAttr("style");
				}
			});

			selectedProtocol = thisProtocol;

			refreshSelectPickerGroup(query, -1);
		});
	}

	function updateSelectPickerID() {
		nextSelectPickerFromID = 0;
		while ($("#selectpicker-from-" + nextSelectPickerFromID).length) {
			++nextSelectPickerFromID;
		}
	}

	function refreshSelectPickerGroup(query, lastSelectPickerID) {
		for (let i = Number(lastSelectPickerID) + 1; i < nextSelectPickerFromID; ++i) {
			// First destroy the selectpicker wrapper, then remove the whole element
			$("#selectpicker-from-" + i).selectpicker("destroy").remove();
		}
		nextSelectPickerFromID = Number(lastSelectPickerID) + 1;

		let protocol = "";
		let serverName = "";
		let serverPort = "";

		let urlQuery = "";

		switch (query) {
			case "from":
				if (selectedProtocol === "")
					return;

				protocol = selectedProtocol + "://";

				if (serverPort !== "") {
					serverPort = ":" + serverPort;
				}

				let fromPath = "/";
				for (let i = 0; i <= lastSelectPickerID; ++i) {
					// None selected option is impossible
					let option = $("#selectpicker-from-" + i).find(":selected").text();

					if (fromPath.slice(-1) !== "/") {
						fromPath += "/";
					}

					fromPath += option;
				}

				fromPath += "?directory=" + encodeURIComponent("true");

				urlQuery = "?from=" + encodeURIComponent(protocol + serverName + serverPort + fromPath);
				break;
			case "to":
				break;
			default:
				break;
		}

		let hostName = window.location.hostname;
		let hostPort = "8000";
		let api = "list";
		let urlPath = "http://" + hostName + ":" + hostPort + "/dataservice/v1/" + api;
		let url = urlPath + urlQuery;

		$.get(url, function(data) {
			let newSelectPicker = createSelectPicker(data.dataInfo, query, nextSelectPickerFromID);

			if (newSelectPicker === "")
				return;

			$("#" + query + "-select-picker").append(newSelectPicker);
			
			$("#selectpicker-from-" + nextSelectPickerFromID).selectpicker("render");

			// Selectpicker on changed callback
			$("#selectpicker-from-" + nextSelectPickerFromID).on("changed.bs.select", function() {
				let thisQuery = $(this).attr("selectpicker-query");
				let thisID = $(this).attr("selectpicker-id");

				if (((typeof thisQuery) !== "undefined") && ((typeof thisID) !== "undefined")) {
					refreshSelectPickerGroup(thisQuery, thisID);
				}
			});

			nextSelectPickerFromID = Number(nextSelectPickerFromID) + 1;
		}).error(function(jqxhr, text, err) {
			console.log(err);
		});
	}

	function getQueryValue(query) {
		let protocol = "";

		if (query === "from") {
			if (selectedProtocol === "")
				return "";

			protocol = selectedProtocol + "://";
		}

		let host = "";
		let port = "";
		let path = "/";

		if (port !== "") {
			port = ":" + port;
		}

		let nextSelectPickerID = nextSelectPickerFromID;

		for (let i = 0; i < nextSelectPickerID; ++i) {
			// None selected option is impossible
			let option = $("#selectpicker-" + query + "-" + i).find(":selected").text();

			if (path.slice(-1) !== "/") {
				path += "/";
			}

			path += option;
		}

		path += $("#text-" + query).val();

		return protocol + host + port + path;
	}

	function getQuery() {
		const QUERIES = [
			{parentName: "", name: "from"},
			{parentName: "", name: "recursive"},
		];

		let query = "";
		let isFirstQuery = true, isInSubQuery = false;

		QUERIES.forEach(function (element) {
			let isSubQuery = (element.parentName !== "");
			let idName = ((!isSubQuery)? '' : element.parentName + '-')
				+ element.name;

			if ($("#checkbox-" + idName).is(":checked")) {
				let newQuery = "";

				// Assign prefix symbol
				if (isFirstQuery && !isInSubQuery) {
					newQuery += "?";
					isFirstQuery = false;
				} else if (!isFirstQuery && !isInSubQuery) {
					if (isSubQuery) {
						isInSubQuery = true;
						newQuery += "?";
					} else {
						newQuery += "&";
					}
				} else if (!isFirstQuery && isInSubQuery) {
					if (!isSubQuery) {
						isInSubQuery = false;
					}
					newQuery += "&";
				}

				// Assign query value
				let encodedQueryValue = "";
				if (element.name === "from") {
					encodedQueryValue += encodeURIComponent(getQueryValue("from"));
				} else {
					let textValue = $("#text-" + idName).val();
					encodedQueryValue += encodeURIComponent(textValue);
				}

				newQuery += element.name + "=" + encodedQueryValue;

				query += (!isSubQuery)? newQuery : encodeURIComponent(newQuery);
			}

		});

		return query;
	}

	function refreshResponseTable(url) {
		$("#alert-panel").hide();

		if (url == "button.send") {
			url = "http://" + window.location.hostname +
				":8000/dataservice/v1/delete" + getQuery();
		}

		window.location.hash = url;

		$.get(url, function(data) {
			// render template: dust.render(templateName, data, callback);
			dust.render('response', data, function(err, out) {
				$('#result-table').html(out);
			});
		}).error(function(jqxhr, text, err) {
			// text = textStatus = "error"
			// err = errorThrown = "Internal Server Error"
			// jqxhr = jqXHR = Object
			let msg = "<p><b>Error!</b><ul>";
			if (jqxhr.status == 500) {
				// Show user the received error message
				let response = JSON.parse(jqxhr.responseText);
				msg += "<li><b>url:</b> " + url + "</li>";
				msg += "<li><b>exception:</b> " + response.RemoteException.RemoteException.exception + "</li>";
				msg += "<li><b>message:</b> " + response.RemoteException.RemoteException.message + "</li>";
			} else {
				// Show user the default error message
				msg += "<li><b>url:</b> " + url + "</li>";
				msg += "<li><b>errorThrown:</b> " + err + "</li>";
			}
			msg += "</ul></p>";
			$('#alert-panel-body').html(msg);
			$('#alert-panel').show();
		});
	}

	function initialize() {
		createQueryFormGroups();

		// compile and register Dust.js
		dust.loadSource(dust.compile($('#tmpl-response').html(), 'response'));

		updateSelectPickerID();
		refreshSelectPickerGroup("from", nextSelectPickerFromID - 1);
	}

	$("#button-send").click(function () {
		refreshResponseTable("button.send");
	});

	initialize();
})();
