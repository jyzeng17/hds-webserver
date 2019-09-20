(function() {
	'use strict';

	let selectedProtocolFrom = "";
	let selectedProtocolTo = "";
	let nextSelectPickerFromID = 0;
	let nextSelectPickerToID = 0;

	function createQueryFormGroups() {
		let html = new QueryFormGroup('from').
			setRequired().setProtocolButtonGroup().html() +
			createSelectPickerFormGroup('from') +
			createCollapseButton('from') + '<div id="from-queries" hidden>' +
			new QueryFormGroup('keep').
			setParentName('from').setPlaceholder(PLACEHOLDER.BOOLEAN).html() +
			'</div>' +
			new QueryFormGroup('to').
			setRequired().setProtocolButtonGroup().html() +
			createSelectPickerFormGroup('to') + createCollapseButton('to') +
			'<div id="to-queries" hidden>' +
			new QueryFormGroup('name').
			setParentName('to').setHidden().html() +
			new QueryFormGroup('location').
			setParentName('to').setHidden().
			setPlaceholder(PLACEHOLDER.HDS_LOCATION).html() +
			new QueryFormGroup('time').
			setParentName('to').setPlaceholder(PLACEHOLDER.TIME).html() +
			'</div>';

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
			if (query === "to") {
				if (thisProtocol === "hds") {
					$("#" + query+ "-name-form-group").show();
					$("#" + query+ "-location-form-group").show();
				} else {
					$("#" + query+ "-name-form-group").hide();
					$("#" + query+ "-location-form-group").hide();
				}
			}

			if (query === "from") {
				selectedProtocolFrom = thisProtocol;
			} else {
				selectedProtocolTo = thisProtocol;
			}

			refreshSelectPickerGroup(query, -1);
		});
	}

	function updateSelectPickerID() {
		// from
		nextSelectPickerFromID = 0;
		while ($("#selectpicker-from-" + nextSelectPickerFromID).length) {
			++nextSelectPickerFromID;
		}
		// to
		nextSelectPickerToID = 0;
		while ($("#selectpicker-to-" + nextSelectPickerToID).length) {
			++nextSelectPickerToID;
		}
	}

	function refreshSelectPickerGroup(query, lastSelectPickerID) {
		let nextSelectPickerID = (query === "from")
			? nextSelectPickerFromID
			: nextSelectPickerToID;

		for (let i = Number(lastSelectPickerID) + 1; i < nextSelectPickerID; ++i) {
			// First destroy the selectpicker wrapper, then remove the whole element
			$("#selectpicker-" + query + "-" + i).selectpicker("destroy").remove();
		}
		if (query === "from") {
			nextSelectPickerFromID = Number(lastSelectPickerID) + 1;
		} else {
			nextSelectPickerToID = Number(lastSelectPickerID) + 1;
		}

		let protocol = "";
		let serverName = "";
		let serverPort = "";

		let urlQuery = "";

		if (query === "from") {
			if (selectedProtocolFrom === "")
				return;

			protocol = selectedProtocolFrom + "://";
		} else {
			if (selectedProtocolTo === "")
				return;

			protocol = selectedProtocolTo + "://";
		}

		// Test
		if (serverPort !== "") {
			serverPort = ":" + serverPort;
		}

		let fromPath = "/";
		for (let i = 0; i <= lastSelectPickerID; ++i) {
			// None selected option is impossible
			let option = $("#selectpicker-" + query + "-" + i).find(":selected").text();

			if (fromPath.slice(-1) !== "/") {
				fromPath += "/";
			}

			fromPath += option;
		}

		fromPath += "?directory=" + encodeURIComponent("true");

		urlQuery = "?from=" + encodeURIComponent(protocol + serverName + serverPort + fromPath);

		let hostName = window.location.hostname;
		let hostPort = "8000";
		let api = "list";
		let urlPath = "http://" + hostName + ":" + hostPort + "/dataservice/v1/" + api;
		let url = urlPath + urlQuery;

		$.get(url, function(data) {
			nextSelectPickerID = (query === "from")
				? nextSelectPickerFromID
				: nextSelectPickerToID;

			let newSelectPicker = createSelectPicker(data.dataInfo, query, nextSelectPickerID);

			if (newSelectPicker === "")
				return;

			$("#" + query + "-select-picker").append(newSelectPicker);
			
			$("#selectpicker-" + query + "-" + nextSelectPickerID).selectpicker("render");

			// Selectpicker on changed callback
			$("#selectpicker-" + query + "-" + nextSelectPickerID).on("changed.bs.select", function() {
				let thisQuery = $(this).attr("selectpicker-query");
				let thisID = $(this).attr("selectpicker-id");

				if (((typeof thisQuery) !== "undefined") && ((typeof thisID) !== "undefined")) {
					refreshSelectPickerGroup(thisQuery, thisID);
				}
			});

			if (query === "from") {
				nextSelectPickerFromID = Number(nextSelectPickerFromID) + 1;
			} else {
				nextSelectPickerToID = Number(nextSelectPickerToID) + 1;
			}
		}).error(function(jqxhr, text, err) {
		});
	}

	function getQueryValue(query) {
		let protocol = "";

		if (query === "from") {
			if (selectedProtocolFrom === "")
				return "";

			protocol = selectedProtocolFrom + "://";
		} else {
			if (selectedProtocolTo === "")
				return "";

			protocol = selectedProtocolTo + "://";
		}

		let host = "";
		let port = "";
		let path = "/";

		if (port !== "") {
			port = ":" + port;
		}

		let nextSelectPickerID = (query === "from")
			? nextSelectPickerFromID
			: nextSelectPickerToID;

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
		const QUERIES = [
			{parentName: "", name: "from"},
			{parentName: "from", name: "keep"},
			{parentName: "", name: "to"},
			{parentName: "to", name: "name"},
			{parentName: "to", name: "location"},
			{parentName: "to", name: "time"}
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
				} else if (element.name === "to") {
					encodedQueryValue += encodeURIComponent(getQueryValue("to"));
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
			url = "http://" + window.location.hostname + ":8000/dataservice/v1/access" + getQuery();
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
