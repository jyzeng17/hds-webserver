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

	function updateSelectPickerID() {
		nextSelectPickerFromID = 0;
		while ($("#selectpicker-from-" + nextSelectPickerFromID).length) {
			++nextSelectPickerFromID;
		}
	}

	function refreshSelectPickerGroup(query, lastSelectPickerID) {
		// 刪除所有在 selectPickerID 後的 selectpicker, 並更新 selectPickerID 值
		for (let i = Number(lastSelectPickerID) + 1; i < nextSelectPickerFromID; ++i) {
			// First destroy the selectpicker wrapper, then remove the whole element
			$("#selectpicker-from-" + i).selectpicker("destroy").remove();
			//console.log(i + " removed");
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

					//console.log("selected option: " + option);

					if (fromPath.slice(-1) !== "/") {
						fromPath += "/";
					}

					fromPath += option;
				}

				fromPath += "?directory=" + encodeURIComponent("true");

				// 需要一個 from query 能夠列出所有前面已選路徑底下的全部檔案和目錄
				urlQuery = "?from=" + encodeURIComponent(protocol + serverName + serverPort + fromPath);
				break;
			case "to":
				break;
			default:
				break;
		}

		// Test
		let hostName = "slave01";
		let hostPort = "8000";
		let api = "list";
		let urlPath = "http://" + hostName + ":" + hostPort + "/dataservice/v1/" + api;
		let url = urlPath + urlQuery;

		//console.log("refresh select picker group url = " + url);

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

				//console.log("onChanged, query=" + query + ", id=" + id);

				if (((typeof thisQuery) !== "undefined") && ((typeof thisID) !== "undefined")) {
					refreshSelectPickerGroup(thisQuery, thisID);
				}
			});

			nextSelectPickerFromID = Number(nextSelectPickerFromID) + 1;
			//console.log("nextSelectPickerFromID = " + nextSelectPickerFromID);
			//console.log("done");
		}).error(function(jqxhr, text, err) {
			// text = textStatus = "error"
			// err = errorThrown = "Internal Server Error"
			// jqxhr = jqXHR = Object

			//let msg = "<p><b>Error!</b><ul>";
			//if (jqxhr.status == 500) {
			//	// Show user the received error message
			//	let response = JSON.parse(jqxhr.responseText);
			//	msg += "<li><b>url:</b> " + url + "</li>";
			//	msg += "<li><b>exception:</b> " + response.RemoteException.RemoteException.exception + "</li>";
			//	msg += "<li><b>message:</b> " + response.RemoteException.RemoteException.message + "</li>";
			//} else {
			//	// Show user the default error message
			//	msg += "<li><b>url:</b> " + url + "</li>";
			//	msg += "<li><b>errorThrown:</b> " + err + "</li>";
			//}
			//msg += "</ul></p>";

			// 隱藏 select picker group 並顯示直接填值的 text input 給使用者輸入
			console.log(err);
		});
	}

	function renderQueryFormGroups() {
		//createQueryFormGroup(parentName, name, isHidden, isRequired, isProtocolButtonGroup)
		var content = ''
			+ createQueryFormGroup("", "from", false, true, true)
			+ createSelectPickerFormGroup("from")
			+ createCollapseButton("from")
			+ '<div id="from-queries" hidden>'
			+ createQueryFormGroup("from", "file", false, false, false, "true/false")
			+ createQueryFormGroup("from", "directory", false, false, false, "true/false")
			+ createQueryFormGroup("from", "time", false, false, false, "yyyy-MM-dd'T'HH:mm:ss.SSS")
			+ createQueryFormGroup("from", "mintime", false, false, false, "yyyy-MM-dd'T'HH:mm:ss.SSS")
			+ createQueryFormGroup("from", "maxtime", false, false, false, "yyyy-MM-dd'T'HH:mm:ss.SSS")
			+ createQueryFormGroup("from", "size", false, false, false)
			+ createQueryFormGroup("from", "minsize", false, false, false)
			+ createQueryFormGroup("from", "maxsize", false, false, false)
			+ createQueryFormGroup("from", "name", false, false, false)
			+ createQueryFormGroup("from", "location", true, false, false, "hdfs/hbase")
			+ '</div>'
			+ createQueryFormGroup("", "limit", false, false, false)
			+ createQueryFormGroup("", "offset", false, false, false);

		$("#query-form-groups").html(content);

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

	function renderStaticContents() {
		renderQueryFormGroups();
	}

	function getUrlWithInodePath(inodePath) {
		return "http://slave01:8000/dataservice/v1/list" + getQuery(inodePath);
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
		var query = "";
		var isFirstQuery = true, isInSubQuery = false;

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

		//let text = $("#selectpicker-from-0").find(":selected").text();

				query += (!isSubQuery)? newQuery : encodeURIComponent(newQuery);
			}

		});

		return query;
	}

	function refreshDirectoryTable(url) {
		$("#alert-panel").hide();

		if (url === "button.send") {
			//url = "http://" + window.location.host + "/dataservice/v1/list?" + getQuery();
			url = "http://slave01:8000/dataservice/v1/list" + getQuery();
			//url = "http://" + $("#text-host").val() + ":" + $("#number-port").val() + "/dataservice/v1/list?" + getQuery();
			console.log("button send url = " + url);
		}

		window.location.hash = url;
		//console.log("2 url === " + url);

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
		for (var i = 0; i < LENGTH; ++i) {
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
		renderStaticContents();

		// compile and register Dust.js
		dust.loadSource(dust.compile($('#tmpl-explorer').html(), 'explorer'));

		var url = window.location.hash.slice(1);
		refillInputFieldsByURL(url);

		updateSelectPickerID();
		refreshSelectPickerGroup("from", nextSelectPickerFromID - 1);

		refreshDirectoryTable(url);
	}

	// Refresh page once url changed
	$(window).bind('hashchange', function () {
		//var url = decodeURIComponent(window.location.hash.slice(1));
		var url = window.location.hash.slice(1);
		refillInputFieldsByURL(url);
		refreshDirectoryTable(url);
		//console.log("window bind");
	});

	$("#button-send").click(function () {
		refreshDirectoryTable("button.send");
	});

	initialize();
})();
