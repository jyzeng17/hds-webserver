(function() {
	"use strict";

	const QUERIES = [
		{parentName: "", name: "from"},
		{parentName: "from", name: "file"},
		{parentName: "from", name: "directory"},
		{parentName: "from", name: "time"},
		{parentName: "from", name: "mintime"},
		{parentName: "from", name: "maxtime"},
		{parentName: "from", name: "size"},
		{parentName: "from", name: "minsize"},
		{parentName: "from", name: "maxsize"},
		{parentName: "from", name: "name"},
		{parentName: "from", name: "location"},
		{parentName: "", name: "limit"},
		{parentName: "", name: "offset"}
	];

	let selectedProtocol = "";
	let nextSelectPickerFromID = 0;

	function createQueryFormGroups() {
		let html = new QueryFormGroup('from').
			setRequired().setProtocolButtonGroup().html() +
			createSelectPickerFormGroup("from") +
			createCollapseButton("from") + '<div id="from-queries" hidden>' +
			new QueryFormGroup('file').
			setParentName('from').setPlaceholder(PLACEHOLDER.BOOLEAN).html() +
			new QueryFormGroup('directory').
			setParentName('from').setPlaceholder(PLACEHOLDER.BOOLEAN).html() +
			new QueryFormGroup('time').
			setParentName('from').setPlaceholder(PLACEHOLDER.TIME).html() +
			new QueryFormGroup('mintime').
			setParentName('from').setPlaceholder(PLACEHOLDER.TIME).html() +
			new QueryFormGroup('maxtime').
			setParentName('from').setPlaceholder(PLACEHOLDER.TIME).html() +
			new QueryFormGroup('size').setParentName('from').html() +
			new QueryFormGroup('minsize').setParentName('from').html() +
			new QueryFormGroup('maxsize').setParentName('from').html() +
			new QueryFormGroup('name').setParentName('from').html() +
			new QueryFormGroup('location').setParentName('from').setHidden().
			setPlaceholder(PLACEHOLDER.HDS_LOCATION).html() +
			'</div>' +
			new QueryFormGroup('limit').html() +
			new QueryFormGroup('offset').html();

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

			// Toggle hidden query form groups
			if (thisProtocol === "hds") {
				$("#" + query + "-location-form-group").show();
			} else {
				$("#" + query + "-location-form-group").hide();
			}

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

				// Test
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

	function getUrlWithInodePath(inodePath) {
		let hostName = window.location.hostname;
		return "http://" + hostName + ":8000/dataservice/v1/list" + getQuery(inodePath);
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

	function getQuery(inodePath = "") {
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
					if (inodePath) {
						encodedQueryValue += encodeURIComponent(inodePath);
					} else {
						encodedQueryValue += encodeURIComponent(getQueryValue("from"));
					}
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

	function refreshDirectoryTable(url) {
		$("#alert-panel").hide();

		if (url === "button.send") {
			url = "http://" + window.location.hostname +
				":8000/dataservice/v1/list" + getQuery();
		}

		window.location.hash = url;

		$.get(url, function(data) {
			// render template: dust.render(templateName, data, callback);
			dust.render('explorer', data, function(err, out) {
				$('#result-table').html(out);

				$(".explorer-browse-links").click(function () {
					let inodePath = $(this).attr('inode-path');
					let url = getUrlWithInodePath(inodePath);
					refreshDirectoryTable(url);
					console.log(url);
				});

				//This needs to be last because it repaints the table
				$('#table-explorer').dataTable( {
					'lengthMenu': [ [25, 50, 100, -1], [25, 50, 100, "All"] ],
					'columns': [
						null, // uri
						null, // location
						null, // name
						null, // size
						null, // ts
						null, // type
						null, // dataowner
					],
					"deferRender": true,
					"scrollX": true,
					"autoWidth": true,
					"order": [[ 5, "asc" ]]
				});
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

	function refillInputFieldsByURL(url) {
		// Clear all checkboxes and input fields first
		const LENGTH = QUERIES.length;
		for (let i = 0; i < LENGTH; ++i) {
			let element = QUERIES[i];
			let isSubQuery = (element.parentName !== "");
			let idName = ((!isSubQuery)? '' : element.parentName + '-')
				+ element.name;
			if (element.name !== "from") {
				$("#checkbox-" + idName).prop('checked', false);
			}
			$("#text-" + idName).val("");
		}
		// Parse query part
		let querySplitter = url.split("?");

		if (querySplitter.length > 1) {
			let queryPart = querySplitter[1];
			let queries = queryPart.split("&");

			for (let i = 0; i < queries.length; ++i) {
				let queryPair = queries[i].split("=");
				let key = queryPair[0];
				if (key === "from") {
					continue;
				}

				let valueWithSubQueries = decodeURIComponent(queryPair[1]);
				// Parse sub queries
				let subQuerySplitter = valueWithSubQueries.split("?");
				let value = subQuerySplitter[0];

				if (subQuerySplitter.length > 1) {
					// Parse sub query value
					let subQueryPart = subQuerySplitter[1];
					let subQueries = subQueryPart.split("&");

					for (let j = 0; j < subQueries.length; ++j) {
						let subQueryPair = subQueries[j].split("=");
						let subKey = subQueryPair[0];
						let subValue = decodeURIComponent(subQueryPair[1]);

						refillInputField(subKey, subValue, true, key);
					}
				}
				refillInputField(key, value);
			}
		}
	}
	
	function refillInputField(key, value, isSubQuery = false, parentKey = "") {
		// Re-check the checkbox
		let idName = (!isSubQuery)? key : parentKey + "-" + key;
		if (key !== "from") {
			$("#checkbox-" + idName).prop('checked', true);
		}
		// Re-enter the input field
		$("#text-" + idName).val(value);
	}

	function initialize() {
		createQueryFormGroups();

		// compile and register Dust.js
		dust.loadSource(dust.compile($('#tmpl-explorer').html(), 'explorer'));

		let url = window.location.hash.slice(1);
		refillInputFieldsByURL(url);

		updateSelectPickerID();
		refreshSelectPickerGroup("from", nextSelectPickerFromID - 1);

		refreshDirectoryTable(url);
	}

	// Refresh page once url changed
	$(window).bind('hashchange', function () {
		let url = window.location.hash.slice(1);
		refillInputFieldsByURL(url);
		refreshDirectoryTable(url);
	});

	$("#button-send").click(function () {
		refreshDirectoryTable("button.send");
	});

	initialize();
})();
